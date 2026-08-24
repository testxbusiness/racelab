import type { LiveDriver, LiveDriverTiming, LiveFreshness, LiveInterval, LiveLap, LivePitStop, LivePosition, LiveRaceControlEvent, LiveRaceState, LiveSession, LiveStint, RaceStatus, StreamHealth } from "./live";
import type { LiveStreamName } from "@/lib/openf1/polling";
import { pollingPolicyFor, sessionLifecycleFor } from "./session-lifecycle";

const LIVE_MAX_AGE_MS = 8_000;
const DELAYED_MAX_AGE_MS = 20_000;

export function calculateFreshness(sourceTimestamp: string | null, receivedAt: string, now = Date.now(), lifecycle?: "UPCOMING" | "LIVE" | "FINALIZING" | "ENDED"): LiveFreshness {
  if (lifecycle === "ENDED" || lifecycle === "FINALIZING" || lifecycle === "UPCOMING") return { sourceTimestamp, receivedAt, ageMs: null, status: "final" };
  if (!sourceTimestamp) return { sourceTimestamp, receivedAt, ageMs: null, status: "unavailable" };
  const ageMs = Math.max(0, now - Date.parse(sourceTimestamp));
  const status = ageMs <= LIVE_MAX_AGE_MS ? "live" : ageMs <= DELAYED_MAX_AGE_MS ? "delayed" : "stale";
  return { sourceTimestamp, receivedAt, ageMs, status };
}

export function deduplicateRaceControl(events: LiveRaceControlEvent[]): LiveRaceControlEvent[] {
  return [...new Map(events.map((event) => [event.id, event])).values()].sort((a, b) => a.sourceTimestamp.localeCompare(b.sourceTimestamp));
}

function latestByDriver<T extends { driverNumber: number; sourceTimestamp: string | null }>(items: T[]): Map<number, T> {
  const output = new Map<number, T>();
  for (const item of items) {
    const current = output.get(item.driverNumber);
    if (!current || (item.sourceTimestamp ?? "") >= (current.sourceTimestamp ?? "")) output.set(item.driverNumber, item);
  }
  return output;
}

function latestStintByDriver(stints: LiveStint[]): Map<number, LiveStint> {
  const output = new Map<number, LiveStint>();
  for (const stint of stints) {
    const current = output.get(stint.driverNumber);
    if (!current || stint.stintNumber > current.stintNumber) output.set(stint.driverNumber, stint);
  }
  return output;
}

function pitStopsByDriver(pitStops: LivePitStop[]): Map<number, number> {
  const output = new Map<number, number>();
  for (const pitStop of pitStops) output.set(pitStop.driverNumber, (output.get(pitStop.driverNumber) ?? 0) + 1);
  return output;
}

function raceStatus(events: LiveRaceControlEvent[]): RaceStatus {
  const values = [...events]
    .sort((a, b) => b.sourceTimestamp.localeCompare(a.sourceTimestamp))
    .map((event) => `${event.flag ?? ""} ${event.message ?? ""}`.toUpperCase());
  for (const value of values) {
    if (/CHEQUERED FLAG|SESSION (ENDED|FINISHED|COMPLETE)|RACE COMPLETE|CLASSIFICATION FINAL/.test(value)) return "ended";
    if (value.includes("RED")) return "red-flag";
    if (value.includes("VIRTUAL SAFETY CAR") || value.includes("VSC")) return "virtual-safety-car";
    if (value.includes("SAFETY CAR") || value.includes("SC DEPLOYED")) return "safety-car";
    if (value.includes("YELLOW") || value.includes("DOUBLE YELLOW")) return "yellow";
    if (value.includes("GREEN") || value.includes("TRACK CLEAR")) return "green";
  }
  return "green";
}

export type LiveRaceInputs = {
  session: LiveSession;
  drivers: LiveDriver[];
  positions: LivePosition[];
  intervals: LiveInterval[];
  laps: LiveLap[];
  stints: LiveStint[];
  pitStops: LivePitStop[];
  raceControl: LiveRaceControlEvent[];
  streams: Record<LiveStreamName | "session" | "drivers", StreamHealth>;
  rateBudget: LiveRaceState["rateBudget"];
  receivedAt: string;
};

export function composeLiveRaceState(input: LiveRaceInputs, now = Date.now()): LiveRaceState {
  const positions = latestByDriver(input.positions);
  const intervals = latestByDriver(input.intervals);
  const laps = latestByDriver(input.laps);
  const bestLaps = new Map<number, LiveLap>();
  for (const lap of input.laps) {
    if (lap.durationSeconds === null || lap.durationSeconds <= 0 || lap.isPitOutLap === true) continue;
    const current = bestLaps.get(lap.driverNumber);
    if (!current || lap.durationSeconds < current.durationSeconds!) bestLaps.set(lap.driverNumber, lap);
  }
  const fastestLap = [...bestLaps.values()].sort((a, b) => a.durationSeconds! - b.durationSeconds!)[0];
  const stints = latestStintByDriver(input.stints);
  const pitStops = pitStopsByDriver(input.pitStops);
  const pitDataAvailable = input.streams.pit.status !== "unavailable" || input.pitStops.length > 0;
  const timing: LiveDriverTiming[] = input.drivers.map((driver) => {
    const position = positions.get(driver.number);
    const interval = intervals.get(driver.number);
    const lap = laps.get(driver.number);
    const stint = stints.get(driver.number);
    const tyreAge = stint && lap ? Math.max(stint.tyreAgeAtStart, stint.tyreAgeAtStart + lap.lapNumber - stint.lapStart) : null;
    const bestLap = bestLaps.get(driver.number);
    return { driver, position: position?.position ?? null, gapToLeader: interval?.gapToLeader ?? null, interval: interval?.interval ?? null, compound: stint?.compound ?? null, tyreAge, lastLapSeconds: lap?.durationSeconds ?? null, sector1Seconds: lap?.sector1Seconds ?? null, sector2Seconds: lap?.sector2Seconds ?? null, sector3Seconds: lap?.sector3Seconds ?? null, bestLapSeconds: bestLap?.durationSeconds ?? null, bestLapNumber: bestLap?.lapNumber ?? null, inPit: null, retired: null, pitStops: pitDataAvailable ? pitStops.get(driver.number) ?? 0 : null, sourceTimestamp: position?.sourceTimestamp ?? interval?.sourceTimestamp ?? lap?.sourceTimestamp ?? null };
  }).sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));
  const sourceTimestamp = [input.streams.position.sourceTimestamp, input.streams.intervals.sourceTimestamp, input.streams.raceControl.sourceTimestamp, input.streams.laps.sourceTimestamp, input.streams.pit.sourceTimestamp].filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
  const events = deduplicateRaceControl(input.raceControl);
  const currentRaceStatus = raceStatus(events);
  const lifecycle = sessionLifecycleFor({ session: input.session, raceStatus: currentRaceStatus, raceControl: events, now });
  return { session: input.session, lapNumber: input.laps.reduce((maximum, lap) => Math.max(maximum, lap.lapNumber), 0) || null, totalLaps: null, raceStatus: currentRaceStatus, fastestLap: fastestLap && fastestLap.durationSeconds !== null ? { driverNumber: fastestLap.driverNumber, lapNumber: fastestLap.lapNumber, durationSeconds: fastestLap.durationSeconds, sourceTimestamp: fastestLap.sourceTimestamp } : null, timing, raceControl: events, freshness: calculateFreshness(sourceTimestamp, input.receivedAt, now, lifecycle), streams: input.streams, rateBudget: input.rateBudget, updatedAt: input.receivedAt, lifecycle, polling: pollingPolicyFor(lifecycle) };
}
