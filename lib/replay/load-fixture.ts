import "server-only";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { ReplayFixtureData, ReplayFixtureManifest } from "./types";

const fixturesRoot = join(process.cwd(), "fixtures");
const json = async <T>(file: string): Promise<T> => JSON.parse(await readFile(file, "utf8")) as T;
const fixtureCache = new Map<string, Promise<ReplayFixtureData>>();

export async function listReplayFixtures(): Promise<ReplayFixtureManifest[]> {
  try {
    const names = await readdir(fixturesRoot, { withFileTypes: true });
    return Promise.all(names.filter((entry) => entry.isDirectory()).map(async (entry) => {
      const root = join(fixturesRoot, entry.name);
      const manifest = await json<ReplayFixtureManifest>(join(root, "manifest.json"));
      if (manifest.displayName) return manifest;
      const sessions = await json<ReplayFixtureData["sessions"]>(join(root, manifest.endpoints.sessions.file));
      const session = sessions[0];
      const year = session?.year ?? (session?.date_start ? new Date(session.date_start).getUTCFullYear() : null);
      return { ...manifest, displayName: `${session?.circuit_short_name ?? session?.country_name ?? "Grand Prix"}${year ? ` ${year}` : ""}` };
    }));
  } catch { return []; }
}

export function loadReplayFixture(id: string): Promise<ReplayFixtureData> {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Invalid replay fixture id");
  const cached = fixtureCache.get(id);
  if (cached) return cached;
  const pending = readReplayFixture(id);
  fixtureCache.set(id, pending);
  pending.catch(() => fixtureCache.delete(id));
  return pending;
}

async function readReplayFixture(id: string): Promise<ReplayFixtureData> {
  const root = join(fixturesRoot, id);
  const manifest = await json<ReplayFixtureManifest>(join(root, "manifest.json"));
  const [sessions, drivers, position, intervals, laps, stints, pit, race_control, weather] = await Promise.all([
    json<ReplayFixtureData["sessions"]>(join(root, manifest.endpoints.sessions.file)),
    json<ReplayFixtureData["drivers"]>(join(root, manifest.endpoints.drivers.file)),
    json<ReplayFixtureData["position"]>(join(root, manifest.endpoints.position.file)),
    json<ReplayFixtureData["intervals"]>(join(root, manifest.endpoints.intervals.file)),
    json<ReplayFixtureData["laps"]>(join(root, manifest.endpoints.laps.file)),
    json<ReplayFixtureData["stints"]>(join(root, manifest.endpoints.stints.file)),
    json<ReplayFixtureData["pit"]>(join(root, manifest.endpoints.pit.file)),
    json<ReplayFixtureData["race_control"]>(join(root, manifest.endpoints.race_control.file)),
    json<ReplayFixtureData["weather"]>(join(root, manifest.endpoints.weather.file)),
  ]);
  const location = (await Promise.all(manifest.location.files.map((file) => json<ReplayFixtureData["location"]>(join(root, file))))).flat();
  return { manifest, sessions, drivers, position, intervals, laps, stints, pit, race_control, weather, location };
}
