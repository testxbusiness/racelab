"use client";

import React, { useMemo, useState } from "react";
import type { LiveDriverTiming } from "@/lib/f1/domain/live";
import { normalizeLocationSample } from "@/lib/f1/domain/location";
import { useTrackMapData } from "@/features/track/useTrackMapData";
import { TrackMap, type TrackMarker } from "./TrackMap";
import type { TrackGeometry } from "./track-geometries";

const statusLabel: Record<ReturnType<typeof useTrackMapData>["status"], string> = { loading: "LOADING MAP", live: "MAP LIVE", delayed: "MAP DELAYED", stale: "MAP STALE", unavailable: "MAP UNAVAILABLE" };

export function TrackMapPanel({ sessionKey, timing, favouriteDriverNumber, geometry }: { sessionKey: number; timing: LiveDriverTiming[]; favouriteDriverNumber: number | null; geometry: TrackGeometry }) {
  const map = useTrackMapData(sessionKey, geometry.bounds);
  const [selectedDriverNumber, setSelectedDriverNumber] = useState<number | null>(favouriteDriverNumber);
  const markers = useMemo<TrackMarker[]>(() => {
    const bounds = map.bounds;
    if (!bounds) return [];
    const drivers = new Map(timing.map((item) => [item.driver.number, item.driver]));
    return map.samples.flatMap((sample) => { const driver = drivers.get(sample.driverNumber); if (!driver) return []; const point = normalizeLocationSample(sample, bounds); return [{ driverNumber: sample.driverNumber, acronym: driver.acronym, teamColour: driver.teamColour, x: point.x, y: point.y }]; });
  }, [map.bounds, map.samples, timing]);
  return <section className="track-map-panel" aria-label={`${geometry.circuit} track map`}><div className="section-heading"><h2>{geometry.circuit} Map</h2><span className={`map-status map-status-${map.status}`}>{statusLabel[map.status]}</span></div>{map.error && !map.samples.length ? <p className="map-message">Location data is not available. Timing continues normally.</p> : null}{!map.samples.length && !map.error ? <p className="map-message">Waiting for the first location samples…</p> : null}{map.samples.length ? <TrackMap geometry={geometry} markers={markers} favouriteDriverNumber={favouriteDriverNumber} selectedDriverNumber={selectedDriverNumber} onSelectDriver={setSelectedDriverNumber} /> : null}{selectedDriverNumber && markers.some((marker) => marker.driverNumber === selectedDriverNumber) ? <p className="map-selected-label">Selected: <strong>{markers.find((marker) => marker.driverNumber === selectedDriverNumber)?.acronym}</strong></p> : null}</section>;
}
