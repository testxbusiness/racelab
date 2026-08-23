import { MONZA_LOCATION_BOUNDS } from "@/lib/f1/domain/location";
import { MONZA_TRACK_PATH, MONZA_TRACK_VIEWBOX } from "./monza-track";
import { ZANDVOORT_LOCATION_BOUNDS, ZANDVOORT_TRACK_PATH, ZANDVOORT_TRACK_VIEWBOX } from "./zandvoort-track";

export type TrackGeometry = { circuit: string; viewBox: string; path: string; bounds: { minX: number; maxX: number; minY: number; maxY: number } };

const geometries: Record<string, TrackGeometry> = {
  monza: { circuit: "Monza", viewBox: MONZA_TRACK_VIEWBOX, path: MONZA_TRACK_PATH, bounds: MONZA_LOCATION_BOUNDS },
  zandvoort: { circuit: "Zandvoort", viewBox: ZANDVOORT_TRACK_VIEWBOX, path: ZANDVOORT_TRACK_PATH, bounds: ZANDVOORT_LOCATION_BOUNDS },
};

export function getTrackGeometry(circuitName: string | null): TrackGeometry | null {
  if (!circuitName) return null;
  return geometries[circuitName.toLowerCase()] ?? null;
}
