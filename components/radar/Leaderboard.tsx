import React from "react";
import type { LiveDriverTiming } from "@/lib/f1/domain/live";
import { LeaderboardRow } from "./LeaderboardRow";

export const Leaderboard = React.memo(function Leaderboard({ timing, favouriteDriverNumber, onDriverSelect }: { timing: LiveDriverTiming[]; favouriteDriverNumber: number | null; onDriverSelect: (driver: LiveDriverTiming) => void }) {
  if (!timing.length) return <section className="leaderboard-card"><div className="section-heading"><h2>Timing</h2><span>NO CLASSIFICATION</span></div><div className="empty-state">Leaderboard data is not available yet. The live shell is ready and will keep checking.</div></section>;
  return <section className="leaderboard-card" aria-label="Live leaderboard"><div className="section-heading"><h2>Timing</h2><span>{timing.length} CARS</span></div><div className="leaderboard-labels"><span>POS / DRIVER</span><span>GAP / INTERVAL</span><span>TYRE / AGE</span></div>{timing.map((driver) => <LeaderboardRow key={driver.driver.number} driver={driver} favourite={driver.driver.number === favouriteDriverNumber} onSelect={() => onDriverSelect(driver)} />)}</section>;
});
