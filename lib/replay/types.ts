import type { OpenF1Driver, OpenF1Interval, OpenF1Lap, OpenF1Location, OpenF1Pit, OpenF1Position, OpenF1RaceControl, OpenF1Session, OpenF1Stint } from "@/lib/openf1/schemas";

export const REPLAY_FIXTURE_VERSION = 1;

export type ReplayEndpointName = "sessions" | "drivers" | "position" | "intervals" | "laps" | "stints" | "pit" | "race_control" | "weather" | "location";
export type ReplayFixtureManifest = {
  format: "racelab-replay";
  version: number;
  sessionKey: number;
  displayName?: string;
  createdAt: string;
  source: "OpenF1";
  sessionStart: string;
  sessionEnd: string | null;
  endpoints: Record<ReplayEndpointName, { file: string; records: number; firstTimestamp: string | null; lastTimestamp: string | null }>;
  location: { files: string[]; windowSeconds: number; downsampleMs: number | null };
};

export type ReplayFixtureData = {
  manifest: ReplayFixtureManifest;
  sessions: OpenF1Session[];
  drivers: OpenF1Driver[];
  position: OpenF1Position[];
  intervals: OpenF1Interval[];
  laps: OpenF1Lap[];
  stints: OpenF1Stint[];
  pit: OpenF1Pit[];
  race_control: OpenF1RaceControl[];
  weather: Array<Record<string, unknown>>;
  location: OpenF1Location[];
};

export type ReplayClockState = { playing: boolean; speed: 1 | 2 | 4 | 10 | 30; elapsedMs: number; lap: number | null };
