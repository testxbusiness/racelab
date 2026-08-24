import React from "react";
import type { LiveRaceState } from "@/lib/f1/domain/live";
import { DriverPortrait } from "./DriverPortrait";
import { TeamLogo } from "./TeamLogo";

function formatLapTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds - minutes * 60).toFixed(3).padStart(6, "0")}`;
}

export function FastestLapCard({ state }: { state: LiveRaceState }) {
  const fastestLap = state.fastestLap;
  const driver = fastestLap ? state.timing.find((item) => item.driver.number === fastestLap.driverNumber)?.driver : null;
  return <section className={`fastest-lap-card${fastestLap && driver ? " fastest-lap-card-ready" : " fastest-lap-card-empty"}`} aria-label="Fastest lap">
    <div className="fastest-lap-heading"><span className="fastest-lap-mark" aria-hidden="true">◷</span><div><strong>FASTEST LAP</strong><span>{fastestLap && driver ? state.lifecycle === "ENDED" ? "Official" : "Provisional" : "Waiting for first completed lap"}</span></div></div>
    {fastestLap && driver ? <div className="fastest-lap-result"><DriverPortrait acronym={driver.acronym} className="fastest-lap-portrait" /><strong>{formatLapTime(fastestLap.durationSeconds)}</strong><span><TeamLogo teamName={driver.teamName} />{driver.acronym} · {driver.teamName ?? "Team unavailable"}</span><small>LAP {fastestLap.lapNumber}</small></div> : null}
  </section>;
}
