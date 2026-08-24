import type { LiveRaceState } from "@/lib/f1/domain/live";
import type { ReplayFixtureData } from "./types";
import { mapDriver, mapInterval, mapLap, mapPitStop, mapPosition, mapRaceControl, mapSession, mapStint } from "@/lib/openf1/mappers";
import { composeLiveRaceState } from "@/lib/f1/domain/compose-live-race-state";

export function replayStateAt(fixture: ReplayFixtureData, elapsedMs: number, now = Date.now()): LiveRaceState {
  const session = mapSession(fixture.sessions[0]);
  const cutoff = Date.parse(session.dateStart ?? fixture.manifest.sessionStart) + elapsedMs;
  const byTime = <T extends { date?: string; date_start?: string | null; date_end?: string | null }>(records: T[]) => records.filter((record) => { const timestamp = record.date_end ?? record.date_start ?? record.date; return timestamp && Date.parse(timestamp) <= cutoff; });
  const raw = { position: byTime(fixture.position), intervals: byTime(fixture.intervals), laps: byTime(fixture.laps), stints: fixture.stints.filter((stint) => stint.lap_start <= fixture.laps.filter((lap) => (lap.date_end ?? lap.date_start ?? lap.date) && Date.parse((lap.date_end ?? lap.date_start ?? lap.date) as string) <= cutoff).reduce((m, lap) => Math.max(m, lap.lap_number), 0)), pit: byTime(fixture.pit), race_control: byTime(fixture.race_control) };
  const receivedAt = new Date(now).toISOString();
  const fresh = { status: "fresh" as const, receivedAt, sourceTimestamp: null, error: null };
  return composeLiveRaceState({ session, drivers: fixture.drivers.map(mapDriver), positions: raw.position.map(mapPosition), intervals: raw.intervals.map(mapInterval), laps: raw.laps.map(mapLap), stints: raw.stints.map(mapStint), pitStops: raw.pit.map(mapPitStop), raceControl: raw.race_control.map(mapRaceControl), streams: { session: fresh, drivers: fresh, position: fresh, intervals: fresh, laps: fresh, stints: fresh, pit: fresh, raceControl: fresh }, rateBudget: { requestsLast60Seconds: 0, maxRequestsPerMinute: 0, usageRatio: 0, warning: "none", authRefreshes: 0, endpoints: {} }, receivedAt }, now);
}
