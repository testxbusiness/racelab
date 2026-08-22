import "server-only";
import { getOpenF1Env } from "./env";
import { tokenResponseSchema } from "./schemas";
import { ProviderError } from "./errors";

type Token = { value: string; expiresAt: number };
let token: Token | undefined;
let tokenPromise: Promise<string> | undefined;
const requestTimes: number[] = [];
type EndpointMetric = { count: number; lastStatus: number | null; lastLatencyMs: number | null; lastPayloadBytes: number | null };
const endpointMetrics = new Map<string, EndpointMetric>();
let authRefreshes = 0;

async function authenticate(): Promise<string> {
  const env = getOpenF1Env();
  if (!env.OPENF1_USERNAME || !env.OPENF1_PASSWORD) throw new ProviderError("authentication", "OpenF1 credentials are not configured", "token", 503);
  const body = new URLSearchParams({ username: env.OPENF1_USERNAME, password: env.OPENF1_PASSWORD });
  const response = await fetch(env.OPENF1_TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  if (!response.ok) throw new ProviderError("authentication", `OpenF1 authentication failed (${response.status})`, "token", response.status);
  const parsed = tokenResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new ProviderError("validation", "OpenF1 authentication response failed validation", "token", 502);
  token = { value: parsed.data.access_token, expiresAt: Date.now() + parsed.data.expires_in * 1000 };
  return token.value;
}

async function getToken(force = false): Promise<string> {
  if (!force && token && token.expiresAt > Date.now() + 30_000) return token.value;
  tokenPromise ??= authenticate().finally(() => { tokenPromise = undefined; });
  return tokenPromise;
}

export async function openF1Fetch(path: string, init?: RequestInit, retried = false): Promise<Response> {
  const env = getOpenF1Env();
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");
  headers.set("authorization", `Bearer ${await getToken(retried)}`);
  const startedAt = Date.now();
  const endpoint = path.split("?")[0] ?? path;
  requestTimes.push(startedAt);
  const response = await fetch(`${env.OPENF1_API_URL}/${path.replace(/^\//, "")}`, { ...init, headers, cache: "no-store" });
  const previous = endpointMetrics.get(endpoint) ?? { count: 0, lastStatus: null, lastLatencyMs: null, lastPayloadBytes: null };
  endpointMetrics.set(endpoint, { count: previous.count + 1, lastStatus: response.status, lastLatencyMs: Date.now() - startedAt, lastPayloadBytes: Number(response.headers.get("content-length")) || null });
  if (response.status === 401 && !retried) { authRefreshes += 1; token = undefined; return openF1Fetch(path, init, true); }
  // OpenF1 uses 404 with { detail: "No results found." } for valid empty queries.
  // The provider validates that response and maps it to an empty collection.
  if (response.status === 404) return response;
  if (!response.ok) throw new ProviderError("http", `OpenF1 request failed (${response.status})`, endpoint, response.status);
  return response;
}

export const resetTokenForTests = () => { token = undefined; tokenPromise = undefined; requestTimes.length = 0; endpointMetrics.clear(); authRefreshes = 0; };
export const getRequestsLastMinute = () => { const cutoff = Date.now() - 60_000; while (requestTimes[0] !== undefined && requestTimes[0] < cutoff) requestTimes.shift(); return requestTimes.length; };
export const getRateBudgetSnapshot = (maxRequestsPerMinute = 60) => {
  const requestsLast60Seconds = getRequestsLastMinute();
  const usageRatio = requestsLast60Seconds / maxRequestsPerMinute;
  const warning: "none" | "warning" | "critical" | "near_limit" = usageRatio >= 0.95 ? "near_limit" : usageRatio >= 0.85 ? "critical" : usageRatio >= 0.7 ? "warning" : "none";
  return { requestsLast60Seconds, maxRequestsPerMinute, usageRatio, warning, authRefreshes, endpoints: Object.fromEntries(endpointMetrics) };
};
