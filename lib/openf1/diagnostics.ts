import type { LiveRaceState } from "@/lib/f1/domain/live";
import { getLiveRaceState } from "./live-state-service";

export async function getDiagnostics(): Promise<{ ok: true; receivedAt: string; state: LiveRaceState } | { ok: false; receivedAt: string; error: string }> {
  const receivedAt = new Date().toISOString();
  try {
    return { ok: true, receivedAt, state: await getLiveRaceState() };
  } catch (error) { return { ok: false, receivedAt, error: error instanceof Error ? error.message : "OpenF1 request failed" }; }
}
