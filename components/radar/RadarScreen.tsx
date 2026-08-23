"use client";

import React, { useEffect, useRef, useState } from "react";
import type { LiveRaceState } from "@/lib/f1/domain/live";
import { selectDriverFocus } from "@/lib/f1/selectors/focus";
import { useFavouriteDriver } from "@/features/focus/useFavouriteDriver";
import { DriverFocusSheet } from "./DriverFocusSheet";
import { EventFeed } from "./EventFeed";
import { Leaderboard } from "./Leaderboard";
import { LiveHeader } from "./LiveHeader";
import { RaceStatus } from "./RaceStatus";
import { RadarNav } from "./RadarNav";
import { RadarViewTabs, type RadarView } from "./RadarViewTabs";
import { TrackMapPanel } from "@/components/track/TrackMapPanel";
import { getTrackGeometry } from "@/components/track/track-geometries";
import { createLastKnownLiveState, LAST_KNOWN_LIVE_KEY, parseLastKnownLiveState } from "@/lib/pwa/last-known-live";
import { useLiveRacePolling } from "@/features/connectivity/useLiveRacePolling";
import { useLowDataMode } from "@/features/preferences/useLowDataMode";

export function RadarScreen({ initialState, initialError }: { initialState: LiveRaceState | null; initialError: string | null }) {
  const [state, setState] = useState(initialState);
  const [error, setError] = useState(initialError);
  const [offline, setOffline] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const stateRef = useRef(state);
  const [lowDataMode, toggleLowDataMode] = useLowDataMode();
  const [favouriteDriverNumber, setFavouriteDriverNumber] = useFavouriteDriver();
  const [focusedDriverNumber, setFocusedDriverNumber] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<RadarView>("timing");
  const focus = state ? selectDriverFocus(state.timing, focusedDriverNumber) : null;
  const trackGeometry = getTrackGeometry(state?.session.circuitName ?? null);
  const mapAvailable = Boolean(trackGeometry);
  const { refreshing, retryAttempt, nextRetryAt, retryNow } = useLiveRacePolling({
    mode: lowDataMode ? "low-data" : "normal",
    onState: (nextState) => {
      setState(nextState);
      setCachedAt(null);
      setError(null);
      window.localStorage.setItem(LAST_KNOWN_LIVE_KEY, JSON.stringify(createLastKnownLiveState(nextState)));
    },
    onError: setError,
  });

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (!initialState && !stateRef.current) {
      const cached = parseLastKnownLiveState(window.localStorage.getItem(LAST_KNOWN_LIVE_KEY));
      if (cached) { setState(cached.state); setCachedAt(cached.savedAt); }
    }
    if (initialState) window.localStorage.setItem(LAST_KNOWN_LIVE_KEY, JSON.stringify(createLastKnownLiveState(initialState)));
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, [initialState]);

  return <main className="radar-page" data-low-data={lowDataMode || undefined}><div className="radar-shell">{state ? <><LiveHeader state={state} reconnecting={refreshing} retrying={retryAttempt > 0} offline={offline} /><RadarViewTabs activeView={activeView} onChange={setActiveView} mapAvailable={mapAvailable} /><div className="refresh-notice" aria-live="polite"><span>{refreshMessage({ cachedAt, error, offline, refreshing, retryAttempt, nextRetryAt, lowDataMode })}</span><div className="resilience-actions"><button type="button" className="resilience-button" onClick={retryNow} disabled={offline || refreshing}>Retry</button><button type="button" className="resilience-button" aria-pressed={lowDataMode} onClick={toggleLowDataMode}>Low data: {lowDataMode ? "On" : "Off"}</button></div></div>{activeView === "timing" ? <div id="timing"><RaceStatus state={state} /><Leaderboard timing={state.timing} favouriteDriverNumber={favouriteDriverNumber} onDriverSelect={(driver) => setFocusedDriverNumber(driver.driver.number)} /></div> : null}{activeView === "map" && trackGeometry ? <TrackMapPanel sessionKey={state.session.key} timing={state.timing} favouriteDriverNumber={favouriteDriverNumber} geometry={trackGeometry} lowDataMode={lowDataMode} /> : null}{activeView === "events" ? <div id="events"><EventFeed events={state.raceControl} /></div> : null}<DriverFocusSheet focus={focus} isFavourite={focus?.timing.driver.number === favouriteDriverNumber} onClose={() => setFocusedDriverNumber(null)} onSetFavourite={() => { if (focus) setFavouriteDriverNumber(focus.timing.driver.number); }} /></> : <section className="unavailable-card"><span className="unavailable-icon" aria-hidden="true">!</span><h1>Live timing unavailable</h1><p>{error ?? "The provider did not return a session. Race Radar will retry automatically."}</p><button type="button" onClick={retryNow} disabled={offline || refreshing}>Retry</button></section>}<RadarNav /></div></main>;
}

function formatCachedAge(savedAt: string): string {
  const ageSeconds = Math.max(0, Math.floor((Date.now() - Date.parse(savedAt)) / 1000));
  if (ageSeconds < 60) return `${ageSeconds}s`;
  const minutes = Math.floor(ageSeconds / 60);
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h`;
}

function refreshMessage({ cachedAt, error, offline, refreshing, retryAttempt, nextRetryAt, lowDataMode }: { cachedAt: string | null; error: string | null; offline: boolean; refreshing: boolean; retryAttempt: number; nextRetryAt: number | null; lowDataMode: boolean }): string {
  if (offline) return "OFFLINE · Showing last valid timing";
  if (cachedAt) return `CACHED · ${formatCachedAge(cachedAt)} old · waiting for live timing`;
  if (refreshing) return "Checking for a newer timing state…";
  if (retryAttempt) return `Live timing delayed · retrying in ${formatRetryDelay(nextRetryAt)}`;
  if (error) return `Showing last valid timing · ${error}`;
  return lowDataMode ? "Low Data Mode · core timing refreshes less often" : "Live timing refreshes automatically";
}

function formatRetryDelay(nextRetryAt: number | null): string {
  if (!nextRetryAt) return "shortly";
  return `${Math.max(1, Math.ceil((nextRetryAt - Date.now()) / 1000))}s`;
}
