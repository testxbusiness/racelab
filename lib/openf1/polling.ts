export const POLLING_INTERVALS = {
  session: 30_000,
  drivers: 30_000,
  position: 6_000,
  intervals: 6_000,
  raceControl: 10_000,
  laps: 15_000,
  stints: 30_000,
  pit: 30_000,
} as const;

export type LiveStreamName = keyof typeof POLLING_INTERVALS;
