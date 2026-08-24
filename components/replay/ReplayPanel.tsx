"use client";
import { useEffect, useRef, useState } from "react";
import type { ReplayClockState, ReplayFixtureManifest } from "@/lib/replay/types";
import type { LiveRaceState } from "@/lib/f1/domain/live";
import { LiveHeader } from "@/components/radar/LiveHeader";
import { RaceStatus } from "@/components/radar/RaceStatus";
import { Leaderboard } from "@/components/radar/Leaderboard";
import { EventFeed } from "@/components/radar/EventFeed";
import Link from "next/link";

export function ReplayPanel() {
  const [fixtures, setFixtures] = useState<ReplayFixtureManifest[]>([]); const [fixture, setFixture] = useState(""); const [clock, setClock] = useState<ReplayClockState>({ playing: false, speed: 1, elapsedMs: 0, lap: null }); const [state, setState] = useState<LiveRaceState | null>(null);
  const elapsedRef = useRef(0); const requestInFlightRef = useRef(false);
  useEffect(() => { elapsedRef.current = clock.elapsedMs; }, [clock.elapsedMs]);
  useEffect(() => {
    let active = true;
    fetch("/api/replay/fixtures", { cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error(`Fixture list failed: ${response.status}`); return response.json(); })
      .then((value) => { if (active) setFixtures(value.fixtures ?? []); })
      .catch(() => { if (active) setFixtures([]); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (!fixture) return; let active = true; const load = async () => { if (requestInFlightRef.current) return; requestInFlightRef.current = true; try { const response = await fetch(`/api/replay/${fixture}?elapsedMs=${elapsedRef.current}`); const value = await response.json(); if (active && value.state) setState(value.state); } finally { requestInFlightRef.current = false; } }; void load(); const timer = window.setInterval(() => { void load(); }, 250); return () => { active = false; window.clearInterval(timer); }; }, [fixture]);
  useEffect(() => { if (!fixture || !clock.playing) return; const timer = window.setInterval(() => setClock((current) => ({ ...current, elapsedMs: current.elapsedMs + 250 * current.speed })), 250); return () => window.clearInterval(timer); }, [fixture, clock.playing]);
  return <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}><p style={{ color: "#ff3b30", fontWeight: 800, letterSpacing: ".15em" }}>SIMULATION</p><h1>Historical Live Replay</h1><label>Fixture <select value={fixture} onChange={(event) => { setFixture(event.target.value); setClock({ playing: false, speed: 1, elapsedMs: 0, lap: null }); }}><option value="">Select a fixture</option>{fixtures.map((item) => <option key={item.sessionKey} value={`session-${item.sessionKey}`}>{item.displayName ?? `Grand Prix ${item.sessionKey}`}</option>)}</select></label><div style={{ display: "flex", gap: 8, margin: "20px 0", flexWrap: "wrap" }}><button onClick={() => setClock((value) => ({ ...value, playing: !value.playing }))}>{clock.playing ? "Pause" : "Play"}</button><button onClick={() => setClock((value) => ({ ...value, playing: false, elapsedMs: 0 }))}>Restart</button>{([1, 2, 4, 10, 30] as const).map((speed) => <button key={speed} aria-pressed={clock.speed === speed} onClick={() => setClock((value) => ({ ...value, speed }))}>{speed}x</button>)}{fixture ? <Link href={`/radar?replay=session-${fixture.replace(/^session-/, "")}`}>Open in Race Radar</Link> : null}</div><p>Virtual time: {Math.floor(clock.elapsedMs / 1000)}s · Lap: {state?.lapNumber ?? "—"}</p>{state ? <section aria-label="Simulated Race Radar"><LiveHeader state={state} reconnecting={false} retrying={false} offline={false} /><RaceStatus state={state} /><Leaderboard timing={state.timing} favouriteDriverNumber={null} onDriverSelect={() => undefined} /><EventFeed events={state.raceControl} /></section> : <p>Choose a fixture to begin.</p>}</main>;
}
