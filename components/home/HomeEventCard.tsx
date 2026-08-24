"use client";

import { useEffect, useMemo, useState } from "react";
import type { LiveSession } from "@/lib/f1/domain/live";
import { featuredSession, scheduledSessionState, type ScheduledSessionState } from "@/lib/f1/domain/event-schedule";

type SessionsResponse = { ok: boolean; sessions: LiveSession[] };

function formatSessionDate(dateStart: string | null): string {
  if (!dateStart) return "Schedule unavailable";
  return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(dateStart));
}

const statusLabel: Record<ScheduledSessionState, string> = { upcoming: "NEXT EVENT", live: "LIVE", ended: "FINISHED" };

export function HomeEventCard() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/openf1/sessions", { cache: "no-store" });
        if (!response.ok) throw new Error("Schedule unavailable");
        const value = await response.json() as SessionsResponse;
        if (active) { setSessions(value.sessions); setFailed(false); }
      } catch {
        if (active) setFailed(true);
      }
    };
    void load();
    const refresh = window.setInterval(() => { void load(); }, 60_000);
    const clock = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => { active = false; window.clearInterval(refresh); window.clearInterval(clock); };
  }, []);

  const session = useMemo(() => featuredSession(sessions, now), [sessions, now]);
  const state = session ? scheduledSessionState(session, now) : null;
  const label = state ? statusLabel[state] : failed ? "SCHEDULE UNAVAILABLE" : "LOADING SCHEDULE";

  return <div className={`home-live-pill${state === "live" ? " home-live-pill-live" : ""}`} aria-live="polite">
    <span className="status-dot" aria-hidden="true" />
    <span className="home-event-copy"><strong>{label}</strong><span>{session?.name ?? "OpenF1 session schedule"}</span></span>
    {session ? <small>{formatSessionDate(session.dateStart)}</small> : null}
  </div>;
}
