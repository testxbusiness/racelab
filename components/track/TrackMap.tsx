"use client";

import React, { memo } from "react";
import { getTrackGeometry, type TrackGeometry } from "./track-geometries";
import { MONZA_TRACK_PATH, MONZA_TRACK_VIEWBOX } from "./monza-track";

export type TrackMarker = { driverNumber: number; acronym: string; teamColour: string | null; x: number; y: number };

const TrackMapGeometry = memo(function TrackMapGeometry({ geometry }: { geometry: TrackGeometry }) {
  return <>
    <path className="track-map-shadow" d={geometry.path} />
    <path className="track-map-path" d={geometry.path} />
  </>;
});

function TrackMapMarkers({ markers, favouriteDriverNumber, selectedDriverNumber, onSelectDriver }: Pick<TrackMapProps, "markers" | "favouriteDriverNumber" | "selectedDriverNumber" | "onSelectDriver">) {
  return <>{markers.map((marker) => {
    const favourite = marker.driverNumber === favouriteDriverNumber;
    const selected = marker.driverNumber === selectedDriverNumber;
    return <g key={marker.driverNumber} className={`track-marker${favourite ? " track-marker-favourite" : ""}${selected ? " track-marker-selected" : ""}`} role="button" tabIndex={0} aria-label={`Select ${marker.acronym} on track`} transform={`translate(${marker.x} ${marker.y})`} onClick={() => onSelectDriver(marker.driverNumber)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectDriver(marker.driverNumber); } }}>
      {favourite ? <circle className="track-marker-ring" cx={0} cy={0} r={18} /> : null}
      <circle className="track-marker-dot" cx={0} cy={0} r={selected ? 12 : 9} style={{ "--marker-colour": marker.teamColour ? `#${marker.teamColour.replace("#", "")}` : "#BBC0C9" } as React.CSSProperties} />
      {selected ? <text className="track-marker-label" x={16} y={-14}>{marker.acronym}</text> : null}
    </g>;
  })}</>;
}

type TrackMapProps = { markers: TrackMarker[]; favouriteDriverNumber: number | null; selectedDriverNumber: number | null; onSelectDriver: (driverNumber: number) => void; geometry?: TrackGeometry };

export function TrackMap(props: TrackMapProps) {
  const { markers, favouriteDriverNumber, selectedDriverNumber, onSelectDriver, geometry = getTrackGeometry("Monza") ?? { circuit: "Monza", viewBox: MONZA_TRACK_VIEWBOX, path: MONZA_TRACK_PATH, bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 } } } = props;
  return <svg className="track-map-svg" viewBox={geometry.viewBox} role="group" aria-label={`${geometry.circuit} track map`}>
    <TrackMapGeometry geometry={geometry} />
    <TrackMapMarkers markers={markers} favouriteDriverNumber={favouriteDriverNumber} selectedDriverNumber={selectedDriverNumber} onSelectDriver={onSelectDriver} />
  </svg>;
}
