import type { LiveDriver, LiveDriverTiming, LiveFreshness, LiveInterval, LiveLap, LivePosition, LiveRaceControlEvent, LiveRaceState, LiveSession, LiveStint, RaceStatus, StreamHealth } from "./live";
import type { LiveStreamName } from "@/lib/openf1/polling";

const LIVE_MAX_AGE_MS = 8_000;
const DELAYED_MAX_AGE_MS = 20_000;

export function calculateFreshness(sourceTimestamp: string | null, receivedAt: string, now = Date.now()): LiveFreshness {
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

function raceStatus(events: LiveRaceControlEvent[], session: LiveSession, now: number): RaceStatus {
  if (session.dateEnd && Date.parse(session.dateEnd) <= now) return "ended";
  const values = [...events]
    .sort((a, b) => b.sourceTimestamp.localeCompare(a.sourceTimestamp))
    .map((event) => `${event.flag ?? ""} ${event.message ?? ""}`.toUpperCase());
  for (const value of values) {
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
  raceControl: LiveRaceControlEvent[];
  streams: Record<LiveStreamName | "session" | "drivers", StreamHealth>;
  rateBudget: LiveRaceState["rateBudget"];
  receivedAt: string;
};

export function composeLiveRaceState(input: LiveRaceInputs, now = Date.now()): LiveRaceState {
  const positions = latestByDriver(input.positions);
  const intervals = latestByDriver(input.intervals);
  const laps = latestByDriver(input.laps);
  const lapTimes = new Map<number, number>();
  for (const lap of input.laps) {
    if (lap.durationSeconds !== null && (!lapTimes.has(lap.driverNumber) || lap.durationSeconds < lapTimes.get(lap.driverNumber)!)) lapTimes.set(lap.driverNumber, lap.durationSeconds);
  }
  const stints = latestStintByDriver(input.stints);
  const timing: LiveDriverTiming[] = input.drivers.map((driver) => {
    const position = positions.get(driver.number);
    const interval = intervals.get(driver.number);
    const lap = laps.get(driver.number);
    const stint = stints.get(driver.number);
    const tyreAge = stint && lap ? Math.max(stint.tyreAgeAtStart, stint.tyreAgeAtStart + lap.lapNumber - stint.lapStart) : null;
    return { driver, position: position?.position ?? null, gapToLeader: interval?.gapToLeader ?? null, interval: interval?.interval ?? null, compound: stint?.compound ?? null, tyreAge, lastLapSeconds: lap?.durationSeconds ?? null, bestLapSeconds: lapTimes.get(driver.number) ?? null, inPit: null, retired: null, sourceTimestamp: position?.sourceTimestamp ?? interval?.sourceTimestamp ?? lap?.sourceTimestamp ?? null };
  }).sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));
  const sourceTimestamp = [input.streams.position.sourceTimestamp, input.streams.intervals.sourceTimestamp, input.streams.raceControl.sourceTimestamp, input.streams.laps.sourceTimestamp].filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
  const events = deduplicateRaceControl(input.raceControl);
  return { session: input.session, lapNumber: input.laps.reduce((maximum, lap) => Math.max(maximum, lap.lapNumber), 0) || null, totalLaps: null, raceStatus: raceStatus(events, input.session, now), timing, raceControl: events, freshness: calculateFreshness(sourceTimestamp, input.receivedAt, now), streams: input.streams, rateBudget: input.rateBudget, updatedAt: input.receivedAt };
}
