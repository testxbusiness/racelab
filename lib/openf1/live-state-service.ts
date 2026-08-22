import "server-only";
import { composeLiveRaceState } from "@/lib/f1/domain/compose-live-race-state";
import type { LiveDriver, LiveInterval, LiveLap, LivePosition, LiveRaceControlEvent, LiveRaceState, LiveSession, LiveStint, StreamHealth } from "@/lib/f1/domain/live";
import { mapDriver, mapInterval, mapLap, mapPosition, mapRaceControl, mapSession, mapStint } from "./mappers";
import { toProviderError } from "./errors";
import { getRateBudgetSnapshot } from "./live-client";
import { openF1Provider, type OpenF1LiveProvider } from "./provider";
import type { LiveStreamName } from "./polling";
import { getOpenF1Env } from "./env";

type CachedStreams = { session: LiveSession | null; drivers: LiveDriver[]; position: LivePosition[]; intervals: LiveInterval[]; laps: LiveLap[]; stints: LiveStint[]; raceControl: LiveRaceControlEvent[] };
type StreamKey = LiveStreamName | "session" | "drivers";
type LoadResult<T> = { data: T; health: StreamHealth };

function emptyCache(): CachedStreams { return { session: null, drivers: [], position: [], intervals: [], laps: [], stints: [], raceControl: [] }; }

export function createLiveStateLoader(provider: OpenF1LiveProvider) {
  let cache = emptyCache();

  async function load<T>(key: StreamKey, fetcher: () => Promise<T>, fallback: T): Promise<LoadResult<T>> {
    const receivedAt = new Date().toISOString();
    try {
      const data = await fetcher();
      const sourceTimestamp = Array.isArray(data) ? data.map((item) => typeof item === "object" && item !== null && "sourceTimestamp" in item && typeof item.sourceTimestamp === "string" ? item.sourceTimestamp : null).filter((value): value is string => value !== null).sort().at(-1) ?? null : null;
      return { data, health: { status: "fresh", receivedAt, sourceTimestamp, error: null } };
    } catch (error) {
      const providerError = toProviderError(error, key);
      return { data: fallback, health: { status: fallback && (!Array.isArray(fallback) || fallback.length > 0) ? "fallback" : "unavailable", receivedAt, sourceTimestamp: null, error: providerError.message } };
    }
  }

  async function getLiveRaceState(): Promise<LiveRaceState> {
    const sessions = await load("session", async () => (await provider.getSessions()).map(mapSession)[0] ?? null, cache.session);
    if (!sessions.data) throw toProviderError(new Error("OpenF1 returned no latest session"), "session");
    cache.session = sessions.data;
    const sessionKey = sessions.data.key;
    const [drivers, position, intervals, laps, stints, raceControl] = await Promise.all([
      load("drivers", async () => (await provider.getDrivers(sessionKey)).map(mapDriver), cache.drivers),
      load("position", async () => (await provider.getPositions(sessionKey)).map(mapPosition), cache.position),
      load("intervals", async () => (await provider.getIntervals(sessionKey)).map(mapInterval), cache.intervals),
      load("laps", async () => (await provider.getLaps(sessionKey)).map(mapLap), cache.laps),
      load("stints", async () => (await provider.getStints(sessionKey)).map(mapStint), cache.stints),
      load("raceControl", async () => (await provider.getRaceControl(sessionKey)).map(mapRaceControl), cache.raceControl),
    ]);
    cache = { session: sessions.data, drivers: drivers.data, position: position.data, intervals: intervals.data, laps: laps.data, stints: stints.data, raceControl: raceControl.data };
    const streams = { session: sessions.health, drivers: drivers.health, position: position.health, intervals: intervals.health, laps: laps.health, stints: stints.health, raceControl: raceControl.health };
    return composeLiveRaceState({ session: sessions.data, drivers: drivers.data, positions: position.data, intervals: intervals.data, laps: laps.data, stints: stints.data, raceControl: raceControl.data, streams, rateBudget: getRateBudgetSnapshot(getOpenF1Env().OPENF1_RATE_LIMIT_PER_MINUTE), receivedAt: new Date().toISOString() });
  }

  return { getLiveRaceState, reset: () => { cache = emptyCache(); } };
}

const defaultLoader = createLiveStateLoader(openF1Provider);
export const getLiveRaceState = defaultLoader.getLiveRaceState;
export const resetLiveStateForTests = defaultLoader.reset;
