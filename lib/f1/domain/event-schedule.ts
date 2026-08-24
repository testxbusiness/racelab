import type { LiveSession } from "./live";

export type ScheduledSessionState = "upcoming" | "live" | "ended";

export function scheduledSessionState(session: Pick<LiveSession, "dateStart" | "dateEnd">, now = Date.now()): ScheduledSessionState {
  const start = session.dateStart ? Date.parse(session.dateStart) : NaN;
  const end = session.dateEnd ? Date.parse(session.dateEnd) : NaN;
  if (Number.isNaN(start) || start > now) return "upcoming";
  if (!Number.isNaN(end) && end < now) return "ended";
  return "live";
}

export function featuredSession(sessions: LiveSession[], now = Date.now()): LiveSession | null {
  const ordered = sessions.filter((session) => session.dateStart).sort((a, b) => Date.parse(a.dateStart!) - Date.parse(b.dateStart!));
  return ordered.find((session) => scheduledSessionState(session, now) === "live")
    ?? ordered.find((session) => scheduledSessionState(session, now) === "upcoming")
    ?? ordered.at(-1)
    ?? null;
}
