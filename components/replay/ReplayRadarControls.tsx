"use client";

import Link from "next/link";
import type { LiveRaceState } from "@/lib/f1/domain/live";
import type { ReplayClockState } from "@/lib/replay/types";

export function ReplayRadarControls({ fixtureId, clock, state, onToggle, onRestart, onSpeed }: { fixtureId: string; clock: ReplayClockState; state: LiveRaceState | null; onToggle: () => void; onRestart: () => void; onSpeed: (speed: ReplayClockState["speed"]) => void }) {
  return <section className="replay-radar-controls" aria-label="Historical replay controls"><div><p className="replay-radar-kicker">SIMULATION</p><strong>Historical Live Replay</strong><span> · {fixtureId.replace(/^session-/, "Session ")}</span></div><div className="replay-radar-actions"><button type="button" onClick={onToggle}>{clock.playing ? "Pause" : "Play"}</button><button type="button" onClick={onRestart}>Restart</button>{([1, 2, 4, 10, 30] as const).map((speed) => <button type="button" key={speed} aria-pressed={clock.speed === speed} onClick={() => onSpeed(speed)}>{speed}x</button>)}<Link href="/replay">Change fixture</Link></div><p>Virtual time: {Math.floor(clock.elapsedMs / 1000)}s · Lap: {state?.lapNumber ?? "—"}</p></section>;
}
