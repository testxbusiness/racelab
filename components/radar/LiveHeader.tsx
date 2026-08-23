import React from "react";
import type { LiveRaceState } from "@/lib/f1/domain/live";
import { ConnectionBadge } from "./ConnectionBadge";
import { DataAge } from "./DataAge";

export function LiveHeader({ state, reconnecting, retrying = false, offline }: { state: LiveRaceState; reconnecting: boolean; retrying?: boolean; offline: boolean }) {
  const lap = state.lapNumber === null ? "LAP —" : state.totalLaps === null ? `LAP ${state.lapNumber}` : `LAP ${state.lapNumber}/${state.totalLaps}`;
  return <header className="live-header"><div className="header-top"><div className="brand-lockup"><span className="signal-icon" aria-hidden="true"><span /></span><div><p className="eyebrow">{state.session.countryName ?? "LIVE SESSION"}</p><h1>{state.session.name}</h1></div></div><span className={`status-chip status-${state.raceStatus}`}>{state.raceStatus.replaceAll("-", " ")}</span></div><div className="header-meta"><ConnectionBadge status={state.freshness.status} reconnecting={reconnecting} retrying={retrying} offline={offline} /><span>{lap}</span><DataAge ageMs={state.freshness.ageMs} receivedAt={state.freshness.receivedAt} /></div><span className="session-type">{state.session.type}</span></header>;
}
