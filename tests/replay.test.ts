import { describe, expect, it } from "vitest";
import { ReplayClock } from "@/lib/replay/clock";
import { replayStateAt } from "@/lib/replay/fixture";
import { createReplayProvider } from "@/lib/replay/provider";
import type { ReplayFixtureData } from "@/lib/replay/types";

const sessionStart = "2026-08-23T12:00:00.000Z";
const fixture = {
  manifest: { format: "racelab-replay", version: 1, sessionKey: 10, createdAt: sessionStart, source: "OpenF1", sessionStart, sessionEnd: "2026-08-23T12:10:00.000Z", endpoints: {} as ReplayFixtureData["manifest"]["endpoints"], location: { files: [], windowSeconds: 900, downsampleMs: null } },
  sessions: [{ session_key: 10, meeting_key: 1, session_name: "Race", session_type: "Race", date_start: sessionStart, date_end: "2026-08-23T12:10:00.000Z" }],
  drivers: [{ driver_number: 1, full_name: "Driver One", name_acronym: "ONE" }],
  position: [{ date: "2026-08-23T12:00:01.000Z", driver_number: 1, position: 1, session_key: 10 }, { date: "2026-08-23T12:00:06.000Z", driver_number: 1, position: 2, session_key: 10 }],
  intervals: [{ date: "2026-08-23T12:00:06.000Z", driver_number: 1, interval: 0, gap_to_leader: 0, session_key: 10 }],
  laps: [{ date: "2026-08-23T12:00:04.000Z", date_start: "2026-08-23T12:00:01.000Z", date_end: "2026-08-23T12:00:04.000Z", driver_number: 1, lap_number: 1, session_key: 10, lap_duration: 3, duration_sector_1: 1, duration_sector_2: 1.1, duration_sector_3: 0.9 }],
  stints: [{ compound: "MEDIUM", driver_number: 1, lap_end: 3, lap_start: 1, meeting_key: 1, session_key: 10, stint_number: 1, tyre_age_at_start: 0 }],
  pit: [], race_control: [], weather: [], location: [{ date: "2026-08-23T12:00:02.000Z", driver_number: 1, session_key: 10, x: 1, y: 2, z: 3 }, { date: "2026-08-23T12:00:07.000Z", driver_number: 1, session_key: 10, x: 4, y: 5, z: 6 }],
} as ReplayFixtureData;

describe("historical replay", () => {
  it("advances deterministically and supports pause, resume, speed, and restart", () => {
    const clock = new ReplayClock(60_000); clock.play(0); clock.tick(1_000); expect(clock.getState().elapsedMs).toBe(1_000); clock.setSpeed(4); clock.tick(2_000); expect(clock.getState().elapsedMs).toBe(5_000); clock.pause(3_000); expect(clock.getState().elapsedMs).toBe(9_000); clock.tick(10_000); expect(clock.getState().elapsedMs).toBe(9_000); clock.restart(); expect(clock.getState().elapsedMs).toBe(0);
  });

  it("does not expose future records or stints", () => {
    expect(replayStateAt(fixture, 2_000).timing[0].position).toBe(1);
    expect(replayStateAt(fixture, 2_000).timing[0].lastLapSeconds).toBeNull();
    expect(replayStateAt(fixture, 5_000).timing[0].lastLapSeconds).toBe(3);
    expect(replayStateAt(fixture, 5_000).timing[0]).toMatchObject({ sector1Seconds: 1, sector2Seconds: 1.1, sector3Seconds: 0.9 });
    expect(replayStateAt(fixture, 5_000).timing[0].compound).toBe("MEDIUM");
  });

  it("uses virtual time for the session lifecycle", () => {
    const virtualNow = Date.parse(sessionStart) + 2_000;
    expect(replayStateAt(fixture, 2_000, virtualNow).lifecycle).toBe("LIVE");
  });

  it("replays locations incrementally from the virtual cursor", async () => {
    const provider = createReplayProvider(fixture, { elapsedMs: () => 10_000 });
    const first = await provider.getLocations(10); expect(first).toHaveLength(2);
    const second = await provider.getLocations(10, first[0].date); expect(second).toHaveLength(1); expect(second[0].x).toBe(4);
  });

  it("keeps endpoint faults isolated for development fault injection", async () => {
    const provider = createReplayProvider(fixture, { fault: { getIntervals: "429" } });
    await expect(provider.getIntervals(10)).rejects.toThrow("429");
    await expect(provider.getPositions(10)).resolves.toHaveLength(2);
  });
});
