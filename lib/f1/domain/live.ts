import type { LiveStreamName } from "@/lib/openf1/polling";

export type FreshnessStatus = "live" | "delayed" | "stale" | "unavailable";
export type RaceStatus = "green" | "yellow" | "safety-car" | "virtual-safety-car" | "red-flag" | "ended" | "unavailable";

export type LiveFreshness = {
  sourceTimestamp: string | null;
  receivedAt: string;
  ageMs: number | null;
  status: FreshnessStatus;
};

export type LiveSession = {
  key: number;
  meetingKey: number;
  name: string;
  type: string;
  countryName: string | null;
  circuitName: string | null;
  dateStart: string | null;
  dateEnd: string | null;
};

export type LiveDriver = { number: number; fullName: string; acronym: string; teamName: string | null; teamColour: string | null };
export type LivePosition = { driverNumber: number; position: number; sourceTimestamp: string };
export type LiveInterval = { driverNumber: number; interval: number | null; gapToLeader: number | null; sourceTimestamp: string };
export type LiveLap = { driverNumber: number; lapNumber: number; sourceTimestamp: string | null };
export type LiveStint = { driverNumber: number; stintNumber: number; compound: string; lapStart: number; lapEnd: number; tyreAgeAtStart: number };
export type LiveRaceControlEvent = { id: string; sourceTimestamp: string; category: string; message: string | null; flag: string | null; driverNumber: number | null; lapNumber: number | null };

export type LiveDriverTiming = {
  driver: LiveDriver;
  position: number | null;
  gapToLeader: number | null;
  interval: number | null;
  compound: string | null;
  tyreAge: number | null;
  inPit: boolean | null;
  retired: boolean | null;
  sourceTimestamp: string | null;
};

export type StreamHealth = { status: "fresh" | "fallback" | "unavailable"; receivedAt: string; sourceTimestamp: string | null; error: string | null };

export type EndpointMetric = { count: number; lastStatus: number | null; lastLatencyMs: number | null; lastPayloadBytes: number | null; lastRecordCount: number | null; validationFailures: number; lastSourceTimestamp: string | null };
export type RateBudget = { requestsLast60Seconds: number; maxRequestsPerMinute: number; usageRatio: number; warning: "none" | "warning" | "critical" | "near_limit"; authRefreshes: number; endpoints: Record<string, EndpointMetric> };

export type LiveRaceState = {
  session: LiveSession;
  lapNumber: number | null;
  totalLaps: number | null;
  raceStatus: RaceStatus;
  timing: LiveDriverTiming[];
  raceControl: LiveRaceControlEvent[];
  freshness: LiveFreshness;
  streams: Record<LiveStreamName | "session" | "drivers", StreamHealth>;
  rateBudget: RateBudget;
  updatedAt: string;
};
