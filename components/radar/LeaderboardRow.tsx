import React from "react";
import type { LiveDriverTiming } from "@/lib/f1/domain/live";
import { TyreBadge } from "./TyreBadge";
import type { LiveGap } from "@/lib/f1/domain/live";

function timingValue(value: LiveGap) { return value === null ? "—" : typeof value === "string" ? value : `${value >= 0 ? "+" : ""}${value.toFixed(3)}`; }

export function LeaderboardRow({ driver, favourite, onSelect }: { driver: LiveDriverTiming; favourite: boolean; onSelect: () => void }) {
  const teamStyle = driver.driver.teamColour ? { "--team-accent": `#${driver.driver.teamColour.replace("#", "")}` } as React.CSSProperties : undefined;
  return <button type="button" className={`leaderboard-row${favourite ? " leaderboard-row-favourite" : ""}`} style={teamStyle} onClick={onSelect} aria-label={`Open ${driver.driver.fullName} driver focus${favourite ? ", favourite driver" : ""}`}><span className="team-accent" aria-hidden="true" /><span className="position">{driver.position ?? "—"}</span><div className="driver-cell"><strong>{favourite ? "★ " : ""}{driver.driver.acronym}</strong><span>{driver.driver.teamName ?? "Team unavailable"}</span></div><div className="gap-cell"><strong>{timingValue(driver.gapToLeader)}</strong><span>{driver.position === 1 ? "LEADER" : `INT ${timingValue(driver.interval)}`}</span></div><TyreBadge compound={driver.compound} age={driver.tyreAge} /><div className="row-status"><span>PITS {driver.pitStops ?? "—"}</span>{driver.inPit ? <span>PIT</span> : null}{driver.retired ? <span>RETIRED</span> : null}</div></button>;
}
