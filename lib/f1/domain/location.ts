import type { LiveLocationSample } from "./live";

export type LocationBounds = { minX: number; maxX: number; minY: number; maxY: number };
export type NormalizedLocation = { driverNumber: number; x: number; y: number; sourceTimestamp: string };

// Bounds captured while preprocessing a complete 2025 Monza lap from OpenF1.
// Keeping them stable prevents live marker positions from rescaling every poll.
export const MONZA_LOCATION_BOUNDS: LocationBounds = { minX: -1500, maxX: 11068, minY: -5801, maxY: 15882 };

export function calculateLocationBounds(samples: LiveLocationSample[]): LocationBounds | null {
  if (!samples.length) return null;
  return { minX: Math.min(...samples.map((sample) => sample.x)), maxX: Math.max(...samples.map((sample) => sample.x)), minY: Math.min(...samples.map((sample) => sample.y)), maxY: Math.max(...samples.map((sample) => sample.y)) };
}

export function expandLocationBounds(current: LocationBounds | null, samples: LiveLocationSample[]): LocationBounds | null {
  const next = calculateLocationBounds(samples);
  if (!next) return current;
  if (!current) return next;
  return { minX: Math.min(current.minX, next.minX), maxX: Math.max(current.maxX, next.maxX), minY: Math.min(current.minY, next.minY), maxY: Math.max(current.maxY, next.maxY) };
}

export function normalizeLocationSample(sample: LiveLocationSample, bounds: LocationBounds): NormalizedLocation {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  return { driverNumber: sample.driverNumber, x: 48 + ((sample.x - bounds.minX) / width) * 904, y: 48 + (1 - (sample.y - bounds.minY) / height) * 664, sourceTimestamp: sample.sourceTimestamp };
}

export function mergeLatestLocationSamples(current: LiveLocationSample[], incoming: LiveLocationSample[]): LiveLocationSample[] {
  const latest = new Map(current.map((sample) => [sample.driverNumber, sample]));
  for (const sample of incoming) {
    const previous = latest.get(sample.driverNumber);
    if (!previous || sample.sourceTimestamp >= previous.sourceTimestamp) latest.set(sample.driverNumber, sample);
  }
  return [...latest.values()];
}
