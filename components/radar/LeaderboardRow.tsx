import React from "react";
import type { LiveDriverTiming } from "@/lib/f1/domain/live";
import { TyreBadge } from "./TyreBadge";

function timingValue(value: number | null) { return value === null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(3)}`; }

export function LeaderboardRow({ driver }: { driver: LiveDriverTiming }) {
  const teamStyle = driver.driver.teamColour ? { "--team-accent": `#${driver.driver.teamColour.replace("#", "")}` } as React.CSSProperties : undefined;
  return <article className="leaderboard-row" style={teamStyle}><span className="team-accent" aria-hidden="true" /><span className="position">{driver.position ?? "—"}</span><div className="driver-cell"><strong>{driver.driver.acronym}</strong><span>{driver.driver.teamName ?? "Team unavailable"}</span></div><div className="gap-cell"><strong>{timingValue(driver.gapToLeader)}</strong><span>{driver.position === 1 ? "LEADER" : `INT ${timingValue(driver.interval)}`}</span></div><TyreBadge compound={driver.compound} age={driver.tyreAge} /><div className="row-status">{driver.inPit ? <span>PIT</span> : null}{driver.retired ? <span>RETIRED</span> : null}</div></article>;
}
