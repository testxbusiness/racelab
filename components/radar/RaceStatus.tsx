import React from "react";
import type { LiveRaceState, RaceStatus } from "@/lib/f1/domain/live";

const copy: Record<RaceStatus, { title: string; detail: string }> = {
  green: { title: "GREEN FLAG", detail: "Track clear" }, yellow: { title: "YELLOW FLAG", detail: "Caution in effect" }, "safety-car": { title: "SAFETY CAR", detail: "Field controlled" }, "virtual-safety-car": { title: "VIRTUAL SAFETY CAR", detail: "Virtual neutralisation" }, "red-flag": { title: "RED FLAG", detail: "Session stopped" }, ended: { title: "SESSION ENDED", detail: "Final timing state" }, unavailable: { title: "STATUS UNAVAILABLE", detail: "Awaiting race control" },
};

export function RaceStatus({ state }: { state: LiveRaceState }) {
  const status = copy[state.raceStatus];
  return <section className={`race-status race-status-${state.raceStatus}`} aria-label={`Race status: ${status.title}`}><span className="status-mark" aria-hidden="true">{state.raceStatus === "green" ? "●" : "!"}</span><div><strong>{status.title}</strong><span>{status.detail}</span></div></section>;
}
