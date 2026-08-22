import "server-only";
import { getOpenF1Env } from "./env";
import { tokenResponseSchema } from "./schemas";

type Token = { value: string; expiresAt: number };
let token: Token | undefined;
let tokenPromise: Promise<string> | undefined;
const requestTimes: number[] = [];

export class OpenF1Error extends Error { constructor(public readonly status: number, message: string) { super(message); } }

async function authenticate(): Promise<string> {
  const env = getOpenF1Env();
  if (!env.OPENF1_USERNAME || !env.OPENF1_PASSWORD) throw new OpenF1Error(503, "OpenF1 credentials are not configured");
  const body = new URLSearchParams({ username: env.OPENF1_USERNAME, password: env.OPENF1_PASSWORD });
  const response = await fetch(env.OPENF1_TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  if (!response.ok) throw new OpenF1Error(response.status, `OpenF1 authentication failed (${response.status})`);
  const parsed = tokenResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new OpenF1Error(502, "OpenF1 authentication response failed validation");
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
  requestTimes.push(Date.now());
  const response = await fetch(`${env.OPENF1_API_URL}/${path.replace(/^\//, "")}`, { ...init, headers, cache: "no-store" });
  if (response.status === 401 && !retried) return openF1Fetch(path, init, true);
  // OpenF1 uses 404 with { detail: "No results found." } for valid empty queries.
  // The provider validates that response and maps it to an empty collection.
  if (response.status === 404) return response;
  if (!response.ok) throw new OpenF1Error(response.status, `OpenF1 request failed (${response.status})`);
  return response;
}

export const resetTokenForTests = () => { token = undefined; tokenPromise = undefined; };
export const getRequestsLastMinute = () => { const cutoff = Date.now() - 60_000; while (requestTimes[0] !== undefined && requestTimes[0] < cutoff) requestTimes.shift(); return requestTimes.length; };
