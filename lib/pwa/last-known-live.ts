import type { LiveRaceState } from "@/lib/f1/domain/live";
import { pollingPolicyFor, sessionLifecycleFor } from "@/lib/f1/domain/session-lifecycle";

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
    const candidate = parsed as { state: LiveRaceState; savedAt: string; sourceTimestamp?: string | null };
    if (!candidate.state.lifecycle || !candidate.state.polling) {
      const lifecycle = sessionLifecycleFor({ session: candidate.state.session, raceStatus: candidate.state.raceStatus, raceControl: candidate.state.raceControl, now: Date.now() });
      candidate.state = { ...candidate.state, lifecycle, polling: pollingPolicyFor(lifecycle), freshness: lifecycle === "ENDED" ? { ...candidate.state.freshness, ageMs: null, status: "final" } : candidate.state.freshness };
    }
    return { state: candidate.state, savedAt: candidate.savedAt, sourceTimestamp: candidate.sourceTimestamp ?? candidate.state.freshness.sourceTimestamp };
  } catch {
    return null;
  }
}
