import type { OpenF1LiveProvider } from "@/lib/openf1/provider";
import type { ReplayFixtureData } from "./types";

type ReplayProviderOptions = { now?: () => number; elapsedMs?: () => number; fault?: Partial<Record<keyof OpenF1LiveProvider | "getWeather", "offline" | "429" | "error" | "delay" | "stale">> };

export function createReplayProvider(fixture: ReplayFixtureData, options: ReplayProviderOptions = {}): OpenF1LiveProvider {
  const now = options.now ?? (() => Date.now());
  const elapsed = options.elapsedMs ?? (() => now() - Date.parse(fixture.manifest.sessionStart));
  const start = Date.parse(fixture.manifest.sessionStart);
  const visible = <T>(records: T[], key: keyof OpenF1LiveProvider): T[] => {
    const fault = options.fault?.[key];
    if (fault === "offline" || fault === "error") throw new Error(`Replay ${String(key)} failure`);
    if (fault === "429") throw new Error(`Replay ${String(key)} rate limited (429)`);
    const cutoff = start + Math.max(0, elapsed());
    const result = records.filter((record) => {
      const metadata = record as Record<string, unknown>;
      const timestamp = metadata.date_end ?? metadata.date_start ?? metadata.date;
      if (typeof timestamp === "string" && Date.parse(timestamp) <= cutoff) return true;
      if (typeof metadata.lap_number === "number") return metadata.lap_number <= maxLap(fixture, cutoff);
      if (typeof metadata.lap_start === "number") return metadata.lap_start <= maxLap(fixture, cutoff);
      return false;
    });
    return fault === "stale" ? result.slice(0, Math.max(0, result.length - 1)) : result;
  };
  const delay = async <T>(value: T, key: keyof OpenF1LiveProvider): Promise<T> => { if (options.fault?.[key] === "delay") await new Promise((resolve) => setTimeout(resolve, 250)); return value; };
  return {
    getSessions: async () => [fixture.sessions[0]],
    getDrivers: async () => fixture.drivers,
    getPositions: async () => delay(visible(fixture.position, "getPositions"), "getPositions"),
    getLocations: async (_sessionKey: number, after: string | null = null) => delay(visible(fixture.location, "getLocations").filter((record) => !after || record.date > after), "getLocations"),
    getIntervals: async () => delay(visible(fixture.intervals, "getIntervals"), "getIntervals"),
    getLaps: async () => delay(visible(fixture.laps, "getLaps"), "getLaps"),
    getStints: async () => delay(visible(fixture.stints, "getStints"), "getStints"),
    getPitStops: async () => delay(visible(fixture.pit, "getPitStops"), "getPitStops"),
    getRaceControl: async () => delay(visible(fixture.race_control, "getRaceControl"), "getRaceControl"),
  };
}

function maxLap(fixture: ReplayFixtureData, cutoff: number): number { return fixture.laps.reduce((max, lap) => { const timestamp = lap.date_end ?? lap.date_start ?? lap.date; return timestamp && Date.parse(timestamp) <= cutoff ? Math.max(max, lap.lap_number) : max; }, 0); }
