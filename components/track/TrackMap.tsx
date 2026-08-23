"use client";

import React, { useEffect, useRef, useState } from "react";
import { MONZA_TRACK_PATH, MONZA_TRACK_VIEWBOX } from "./monza-track";

export type TrackMarker = { driverNumber: number; acronym: string; teamColour: string | null; x: number; y: number };

function interpolate(from: TrackMarker, to: TrackMarker, progress: number): TrackMarker {
  return { ...to, x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress };
}

export function TrackMap({ markers, favouriteDriverNumber, selectedDriverNumber, onSelectDriver }: { markers: TrackMarker[]; favouriteDriverNumber: number | null; selectedDriverNumber: number | null; onSelectDriver: (driverNumber: number) => void }) {
  const [renderedMarkers, setRenderedMarkers] = useState(markers);
  const previousMarkers = useRef(markers);
  useEffect(() => {
    const from = new Map(previousMarkers.current.map((marker) => [marker.driverNumber, marker]));
    const started = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - started) / 900);
      setRenderedMarkers(markers.map((marker) => interpolate(from.get(marker.driverNumber) ?? marker, marker, progress)));
      if (progress < 1) frame = requestAnimationFrame(animate);
      else previousMarkers.current = markers;
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [markers]);

  return <svg className="track-map-svg" viewBox={MONZA_TRACK_VIEWBOX} role="group" aria-label="Monza track map">
    <path className="track-map-shadow" d={MONZA_TRACK_PATH} />
    <path className="track-map-path" d={MONZA_TRACK_PATH} />
    {renderedMarkers.map((marker) => {
      const favourite = marker.driverNumber === favouriteDriverNumber;
      const selected = marker.driverNumber === selectedDriverNumber;
      return <g key={marker.driverNumber} className={`track-marker${favourite ? " track-marker-favourite" : ""}${selected ? " track-marker-selected" : ""}`} role="button" tabIndex={0} aria-label={`Select ${marker.acronym} on track`} onClick={() => onSelectDriver(marker.driverNumber)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectDriver(marker.driverNumber); } }}>
        {favourite ? <circle className="track-marker-ring" cx={marker.x} cy={marker.y} r={18} /> : null}
        <circle className="track-marker-dot" cx={marker.x} cy={marker.y} r={selected ? 12 : 9} style={{ "--marker-colour": marker.teamColour ? `#${marker.teamColour.replace("#", "")}` : "#BBC0C9" } as React.CSSProperties} />
        {selected ? <text className="track-marker-label" x={marker.x + 16} y={marker.y - 14}>{marker.acronym}</text> : null}
      </g>;
    })}
  </svg>;
}
