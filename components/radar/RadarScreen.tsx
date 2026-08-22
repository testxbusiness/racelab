"use client";

import React, { useEffect, useState } from "react";
import type { LiveRaceState } from "@/lib/f1/domain/live";
import { EventFeed } from "./EventFeed";
import { Leaderboard } from "./Leaderboard";
import { LiveHeader } from "./LiveHeader";
import { RaceStatus } from "./RaceStatus";

type ApiResult = { ok: true; state: LiveRaceState } | { ok: false; error: string };

export function RadarScreen({ initialState, initialError }: { initialState: LiveRaceState | null; initialError: string | null }) {
  const [state, setState] = useState(initialState);
  const [error, setError] = useState(initialError);
  const [reconnecting, setReconnecting] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const refresh = async () => {
      if (!navigator.onLine) return;
      setReconnecting(true);
      try {
        const response = await fetch("/api/openf1/live", { cache: "no-store" });
        const result = (await response.json()) as ApiResult;
        if (result.ok) { setState(result.state); setError(null); } else if (!state) setError(result.error);
      } catch { if (!state) setError("Live provider unavailable"); }
      finally { setReconnecting(false); }
    };
    const timer = window.setInterval(refresh, 6_000);
    return () => { window.clearInterval(timer); window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, [state]);

  return <main className="radar-page"><div className="radar-shell"><div className="brand-row"><span className="brand-mark">RL</span><span>RACELAB / RACE RADAR</span></div>{state ? <><LiveHeader state={state} reconnecting={reconnecting} offline={offline} /><div className="refresh-notice" aria-live="polite">{error ? `Showing last valid timing · ${error}` : reconnecting ? "Checking for a newer timing state…" : "Live timing refreshes automatically"}</div><RaceStatus state={state} /><Leaderboard timing={state.timing} /><EventFeed events={state.raceControl} /></> : <section className="unavailable-card"><span className="unavailable-icon" aria-hidden="true">!</span><h1>Live timing unavailable</h1><p>{error ?? "The provider did not return a session. Race Radar will retry automatically."}</p><button type="button" onClick={() => window.location.reload()}>Retry</button></section>}</div></main>;
}
