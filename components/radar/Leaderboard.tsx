import React from "react";
import type { LiveDriverTiming } from "@/lib/f1/domain/live";
import { LeaderboardRow } from "./LeaderboardRow";

export function Leaderboard({ timing }: { timing: LiveDriverTiming[] }) {
  if (!timing.length) return <section className="leaderboard-card"><div className="section-heading"><h2>Timing</h2><span>NO CLASSIFICATION</span></div><div className="empty-state">Leaderboard data is not available yet. The live shell is ready and will keep checking.</div></section>;
  return <section className="leaderboard-card" aria-label="Live leaderboard"><div className="section-heading"><h2>Timing</h2><span>{timing.length} CARS</span></div><div className="leaderboard-labels"><span>POS / DRIVER</span><span>GAP / INTERVAL</span><span>TYRE / AGE</span></div>{timing.map((driver) => <LeaderboardRow key={driver.driver.number} driver={driver} />)}</section>;
}
