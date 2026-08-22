import React from "react";
import type { LiveRaceState } from "@/lib/f1/domain/live";
import { ConnectionBadge } from "./ConnectionBadge";
import { DataAge } from "./DataAge";

export function LiveHeader({ state, reconnecting, offline }: { state: LiveRaceState; reconnecting: boolean; offline: boolean }) {
  const lap = state.lapNumber === null ? "LAP —" : state.totalLaps === null ? `LAP ${state.lapNumber}` : `LAP ${state.lapNumber}/${state.totalLaps}`;
  return <header className="live-header"><div className="header-top"><ConnectionBadge status={state.freshness.status} reconnecting={reconnecting} offline={offline} /><span className="session-type">{state.session.type}</span></div><div className="header-title-row"><div><p className="eyebrow">{state.session.countryName ?? "LIVE SESSION"}</p><h1>{state.session.name}</h1></div><span className={`status-chip status-${state.raceStatus}`}>{state.raceStatus.replaceAll("-", " ")}</span></div><div className="header-meta"><span>{lap}</span><DataAge ageMs={state.freshness.ageMs} receivedAt={state.freshness.receivedAt} /></div></header>;
}
