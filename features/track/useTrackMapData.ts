"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { MONZA_LOCATION_BOUNDS, mergeLatestLocationSamples, type LocationBounds } from "@/lib/f1/domain/location";
import type { LiveLocationSample } from "@/lib/f1/domain/live";

type MapStatus = "loading" | "live" | "delayed" | "stale" | "unavailable" | "paused";
type MapData = { samples: LiveLocationSample[]; bounds: LocationBounds; sourceTimestamp: string | null; status: MapStatus; error: string | null };
const sampleSchema = z.object({ driverNumber: z.number(), x: z.number(), y: z.number(), z: z.number(), sourceTimestamp: z.string() });
const responseSchema = z.discriminatedUnion("ok", [z.object({ ok: z.literal(true), snapshot: z.object({ samples: z.array(sampleSchema), sourceTimestamp: z.string().nullable(), receivedAt: z.string() }) }), z.object({ ok: z.literal(false), error: z.string() })]);

export function locationStatusFor(sourceTimestamp: string | null, now = Date.now()): MapStatus {
  if (!sourceTimestamp) return "unavailable";
  const age = Math.max(0, now - Date.parse(sourceTimestamp));
  return age <= 8_000 ? "live" : age <= 20_000 ? "delayed" : "stale";
}

export function useTrackMapData(sessionKey: number, coordinateBounds: LocationBounds = MONZA_LOCATION_BOUNDS, enabled = true): MapData {
  const [data, setData] = useState<MapData>({ samples: [], bounds: coordinateBounds, sourceTimestamp: null, status: "loading", error: null });
  useEffect(() => {
    let active = true;
    let visibilityTimer: number | null = null;
    if (!enabled) {
      setData({ samples: [], bounds: coordinateBounds, sourceTimestamp: null, status: "paused", error: null });
      return () => { active = false; };
    }
    setData({ samples: [], bounds: coordinateBounds, sourceTimestamp: null, status: "loading", error: null });
    let cursor: string | null = null;
    const storageKey = `racelab:location-cursor:${sessionKey}`;
    try { cursor = window.sessionStorage.getItem(storageKey); } catch { cursor = null; }
    if (!cursor) cursor = new Date(Date.now() - 15_000).toISOString();
    const refresh = async () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      try {
        const response = await fetch(`/api/openf1/location?session_key=${sessionKey}&after=${encodeURIComponent(cursor ?? "")}`, { cache: "no-store" });
        const parsed = responseSchema.safeParse(await response.json());
        if (!parsed.success) throw new Error("Invalid location response");
        if (!parsed.data.ok) throw new Error(parsed.data.error);
        if (!active) return;
        const incoming = parsed.data.snapshot.samples;
        const nextTimestamp = parsed.data.snapshot.sourceTimestamp;
        if (nextTimestamp && (!cursor || nextTimestamp > cursor)) { cursor = nextTimestamp; try { window.sessionStorage.setItem(storageKey, cursor); } catch { /* storage is an optional optimization */ } }
        setData((previous) => { const samples = mergeLatestLocationSamples(previous.samples, incoming); return { samples, bounds: coordinateBounds, sourceTimestamp: nextTimestamp ?? previous.sourceTimestamp, status: locationStatusFor(nextTimestamp ?? previous.sourceTimestamp), error: null }; });
      } catch (error) {
        if (!active) return;
        setData((previous) => ({ ...previous, status: previous.samples.length ? locationStatusFor(previous.sourceTimestamp) : "unavailable", error: error instanceof Error ? error.message : "Location unavailable" }));
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 5_000);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (visibilityTimer !== null) window.clearTimeout(visibilityTimer);
      visibilityTimer = window.setTimeout(() => { visibilityTimer = null; void refresh(); }, 1_000);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => { active = false; window.clearInterval(timer); if (visibilityTimer !== null) window.clearTimeout(visibilityTimer); document.removeEventListener("visibilitychange", onVisible); };
  }, [sessionKey, coordinateBounds, enabled]);
  return data;
}
