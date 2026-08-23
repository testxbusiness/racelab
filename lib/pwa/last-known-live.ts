import type { LiveRaceState } from "@/lib/f1/domain/live";

export type LastKnownLiveState = { state: LiveRaceState; savedAt: string; sourceTimestamp: string | null };

export const LAST_KNOWN_LIVE_KEY = "racelab:last-known-live";

export function createLastKnownLiveState(state: LiveRaceState, savedAt = new Date().toISOString()): LastKnownLiveState {
  return { state, savedAt, sourceTimestamp: state.freshness.sourceTimestamp };
}

export function parseLastKnownLiveState(value: string | null): LastKnownLiveState | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || !("state" in parsed) || !("savedAt" in parsed) || typeof parsed.savedAt !== "string" || Number.isNaN(Date.parse(parsed.savedAt))) return null;
    return parsed as LastKnownLiveState;
  } catch {
    return null;
  }
}
