import "server-only";
import { composeLiveRaceState } from "@/lib/f1/domain/compose-live-race-state";
import type { LiveDriver, LiveInterval, LiveLap, LivePosition, LiveRaceControlEvent, LiveRaceState, LiveSession, LiveStint, StreamHealth } from "@/lib/f1/domain/live";
import { mapDriver, mapInterval, mapLap, mapPosition, mapRaceControl, mapSession, mapStint } from "./mappers";
import { toProviderError } from "./errors";
import { getRateBudgetSnapshot } from "./live-client";
import { openF1Provider, type OpenF1LiveProvider } from "./provider";
import { POLLING_INTERVALS, type LiveStreamName } from "./polling";
import { getOpenF1Env } from "./env";

type CachedStreams = { session: LiveSession | null; drivers: LiveDriver[]; position: LivePosition[]; intervals: LiveInterval[]; laps: LiveLap[]; stints: LiveStint[]; raceControl: LiveRaceControlEvent[] };
type StreamKey = LiveStreamName;
type LoadResult<T> = { data: T; health: StreamHealth };
type StreamMeta = Partial<Record<StreamKey, { fetchedAt: number; health: StreamHealth }>>;

function emptyCache(): CachedStreams { return { session: null, drivers: [], position: [], intervals: [], laps: [], stints: [], raceControl: [] }; }

export function createLiveStateLoader(provider: OpenF1LiveProvider) {
  let cache = emptyCache();
  let meta: StreamMeta = {};

  async function load<T>(key: StreamKey, fetcher: () => Promise<T>, fallback: T, intervalMs: number, now: number): Promise<LoadResult<T>> {
    const previous = meta[key];
    if (previous && now - previous.fetchedAt < intervalMs) return { data: fallback, health: previous.health };
    const receivedAt = new Date(now).toISOString();
    try {
      const data = await fetcher();
      const sourceTimestamp = Array.isArray(data) ? data.map((item) => typeof item === "object" && item !== null && "sourceTimestamp" in item && typeof item.sourceTimestamp === "string" ? item.sourceTimestamp : null).filter((value): value is string => value !== null).sort().at(-1) ?? null : null;
      const health = { status: "fresh" as const, receivedAt, sourceTimestamp, error: null };
      meta[key] = { fetchedAt: now, health };
      return { data, health };
    } catch (error) {
      const providerError = toProviderError(error, key);
      const health = { status: fallback && (!Array.isArray(fallback) || fallback.length > 0) ? "fallback" as const : "unavailable" as const, receivedAt, sourceTimestamp: null, error: providerError.message };
      meta[key] = { fetchedAt: now, health };
      return { data: fallback, health };
    }
  }

  async function getLiveRaceState(): Promise<LiveRaceState> {
    const now = Date.now();
    const sessions = await load("session", async () => selectRaceSession((await provider.getSessions()).map(mapSession)), cache.session, POLLING_INTERVALS.session, now);
    if (!sessions.data) throw toProviderError(new Error("OpenF1 returned no latest session"), "session");
    cache.session = sessions.data;
    const sessionKey = sessions.data.key;
    const [drivers, position, intervals, laps, stints, raceControl] = await Promise.all([
      load("drivers", async () => (await provider.getDrivers(sessionKey)).map(mapDriver), cache.drivers, POLLING_INTERVALS.drivers, now),
      load("position", async () => (await provider.getPositions(sessionKey)).map(mapPosition), cache.position, POLLING_INTERVALS.position, now),
      load("intervals", async () => (await provider.getIntervals(sessionKey)).map(mapInterval), cache.intervals, POLLING_INTERVALS.intervals, now),
      load("laps", async () => (await provider.getLaps(sessionKey)).map(mapLap), cache.laps, POLLING_INTERVALS.laps, now),
      load("stints", async () => (await provider.getStints(sessionKey)).map(mapStint), cache.stints, POLLING_INTERVALS.stints, now),
      load("raceControl", async () => (await provider.getRaceControl(sessionKey)).map(mapRaceControl), cache.raceControl, POLLING_INTERVALS.raceControl, now),
    ]);
    cache = { session: sessions.data, drivers: drivers.data, position: position.data, intervals: intervals.data, laps: laps.data, stints: stints.data, raceControl: raceControl.data };
    const streams = { session: sessions.health, drivers: drivers.health, position: position.health, intervals: intervals.health, laps: laps.health, stints: stints.health, raceControl: raceControl.health };
    return composeLiveRaceState({ session: sessions.data, drivers: drivers.data, positions: position.data, intervals: intervals.data, laps: laps.data, stints: stints.data, raceControl: raceControl.data, streams, rateBudget: getRateBudgetSnapshot(getOpenF1Env().OPENF1_RATE_LIMIT_PER_MINUTE), receivedAt: new Date(now).toISOString() }, now);
  }

  return { getLiveRaceState, reset: () => { cache = emptyCache(); meta = {}; } };
}

export function selectRaceSession(sessions: LiveSession[]): LiveSession | null {
  return sessions.find((session) => session.type.toLowerCase() === "race") ?? [...sessions].sort((a, b) => (a.dateStart ?? "").localeCompare(b.dateStart ?? "")).at(-1) ?? null;
}

const defaultLoader = createLiveStateLoader(openF1Provider);
export const getLiveRaceState = defaultLoader.getLiveRaceState;
export const resetLiveStateForTests = defaultLoader.reset;
