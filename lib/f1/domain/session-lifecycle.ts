import type { LiveRaceControlEvent, LiveSession, RaceStatus } from "./live";

export type SessionLifecycle = "UPCOMING" | "LIVE" | "FINALIZING" | "ENDED";
export type LivePollingGroup = "position" | "intervals" | "raceControl" | "laps" | "stints" | "pit" | "weather" | "location";

export const LIVE_POLLING_GROUPS: readonly LivePollingGroup[] = ["position", "intervals", "raceControl", "laps", "stints", "pit", "weather", "location"];
export const SESSION_FINALIZATION_GRACE_MS = 30_000;

export type SessionPollingPolicy = {
  enabled: boolean;
  activeGroups: readonly LivePollingGroup[];
};

export function pollingPolicyFor(lifecycle: SessionLifecycle): SessionPollingPolicy {
  return lifecycle === "LIVE" ? { enabled: true, activeGroups: LIVE_POLLING_GROUPS } : { enabled: false, activeGroups: [] };
}

function normalizedEvent(event: LiveRaceControlEvent): string {
  return `${event.category} ${event.flag ?? ""} ${event.message ?? ""}`.toUpperCase();
}

export function hasTerminalSessionSignal(events: LiveRaceControlEvent[]): boolean {
  return events.some((event) => /CHEQUERED FLAG|SESSION (ENDED|FINISHED|COMPLETE)|RACE COMPLETE|CLASSIFICATION FINAL/.test(normalizedEvent(event)));
}

export function hasActiveSessionSignal(events: LiveRaceControlEvent[], raceStatus: RaceStatus): boolean {
  if (["yellow", "safety-car", "virtual-safety-car", "red-flag"].includes(raceStatus)) return true;
  return events.some((event) => /GREEN|YELLOW|SAFETY CAR|VIRTUAL SAFETY CAR|RED FLAG|DRS|TRACK CLEAR|SESSION RESUMED/.test(normalizedEvent(event)));
}

export function sessionLifecycleFor({ session, raceStatus, raceControl, now = Date.now() }: { session: LiveSession; raceStatus: RaceStatus; raceControl: LiveRaceControlEvent[]; now?: number }): SessionLifecycle {
  if (hasTerminalSessionSignal(raceControl) || raceStatus === "ended") return "ENDED";
  const dateStart = session.dateStart ? Date.parse(session.dateStart) : null;
  const dateEnd = session.dateEnd ? Date.parse(session.dateEnd) : null;
  if (dateStart !== null && dateStart > now) return "UPCOMING";
  if (hasActiveSessionSignal(raceControl, raceStatus)) return "LIVE";
  if (dateEnd === null || dateEnd > now) return "LIVE";
  return now - dateEnd < SESSION_FINALIZATION_GRACE_MS ? "FINALIZING" : "ENDED";
}
