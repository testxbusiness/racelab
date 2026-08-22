import { getOpenF1Env } from "./env";

export async function openF1HistoricalFetch(path: string, init?: RequestInit): Promise<Response> {
  const env = getOpenF1Env();
  const response = await fetch(`${env.OPENF1_API_URL}/${path.replace(/^\//, "")}`, { ...init, headers: { accept: "application/json", ...init?.headers }, cache: "no-store" });
  if (!response.ok) throw new Error(`OpenF1 historical request failed (${response.status})`);
  return response;
}
