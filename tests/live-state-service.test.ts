import { afterEach, describe, expect, it, vi } from "vitest";
import { createLiveStateLoader, selectRaceSession } from "@/lib/openf1/live-state-service";
import type { OpenF1LiveProvider } from "@/lib/openf1/provider";

const timestamp = "2026-08-22T14:59:58.000Z";

describe("live state loader", () => {
  afterEach(() => { vi.useRealTimers(); });

  it("selects the scheduled Race session when the provider returns a meeting timeline", () => {
    expect(selectRaceSession([
      { key: 1, meetingKey: 2, name: "Sprint", type: "Race", countryName: "Netherlands", circuitName: "Zandvoort", dateStart: "2026-08-22T10:00:00Z", dateEnd: null },
      { key: 2, meetingKey: 2, name: "Qualifying", type: "Qualifying", countryName: "Netherlands", circuitName: "Zandvoort", dateStart: "2026-08-22T14:00:00Z", dateEnd: null },
      { key: 3, meetingKey: 2, name: "Race", type: "Race", countryName: "Netherlands", circuitName: "Zandvoort", dateStart: "2026-08-23T13:00:00Z", dateEnd: null },
    ])?.key).toBe(3);
  });

  it("retains the last valid stream when one endpoint fails", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-22T15:00:00.000Z"));
    let failIntervals = false;
    const provider: OpenF1LiveProvider = {
      getSessions: async () => [{ session_key: 1, meeting_key: 2, session_name: "Race", session_type: "Race", date_start: timestamp }],
      getDrivers: async () => [{ driver_number: 16, full_name: "Charles Leclerc", name_acronym: "LEC" }],
      getPositions: async () => [{ date: timestamp, driver_number: 16, position: 2, session_key: 1 }],
      getLocations: async () => [],
      getIntervals: async () => { if (failIntervals) throw new Error("intervals down"); return [{ date: timestamp, driver_number: 16, session_key: 1, interval: 1.2, gap_to_leader: 4.1 }]; },
      getLaps: async () => [{ session_key: 1, driver_number: 16, lap_number: 20, date_start: null, date_end: null, lap_duration: null }],
      getStints: async () => [],
      getPitStops: async () => [],
      getRaceControl: async () => [],
    };
    const loader = createLiveStateLoader(provider);
    const initial = await loader.getLiveRaceState();
    failIntervals = true;
    vi.advanceTimersByTime(6_000);
    const recovered = await loader.getLiveRaceState();
    expect(initial.timing[0]?.interval).toBe(1.2);
    expect(recovered.timing[0]?.interval).toBe(1.2);
    expect(recovered.streams.intervals.status).toBe("fallback");
    expect(recovered.streams.intervals.error).toBe("intervals down");
  });

  it("applies stream-specific polling windows", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-22T15:00:00.000Z"));
    const calls = { position: 0, intervals: 0, laps: 0, raceControl: 0 };
    const provider: OpenF1LiveProvider = {
      getSessions: async () => [{ session_key: 1, meeting_key: 2, session_name: "Race", session_type: "Race", date_start: timestamp }],
      getDrivers: async () => [{ driver_number: 16, full_name: "Charles Leclerc", name_acronym: "LEC" }],
      getPositions: async () => { calls.position += 1; return [{ date: timestamp, driver_number: 16, position: 2, session_key: 1 }]; },
      getLocations: async () => [],
      getIntervals: async () => { calls.intervals += 1; return [{ date: timestamp, driver_number: 16, session_key: 1, interval: 1.2, gap_to_leader: 4.1 }]; },
      getLaps: async () => { calls.laps += 1; return [{ session_key: 1, driver_number: 16, lap_number: 20, date_start: null, date_end: null, lap_duration: null }]; },
      getStints: async () => [],
      getPitStops: async () => [],
      getRaceControl: async () => { calls.raceControl += 1; return []; },
    };
    const loader = createLiveStateLoader(provider);
    await loader.getLiveRaceState();
    vi.advanceTimersByTime(6_000);
    await loader.getLiveRaceState();
    expect(calls.position).toBe(2);
    expect(calls.intervals).toBe(2);
    expect(calls.laps).toBe(1);
    expect(calls.raceControl).toBe(1);
    vi.advanceTimersByTime(4_000);
    await loader.getLiveRaceState();
    expect(calls.laps).toBe(1);
    expect(calls.raceControl).toBe(2);
    vi.advanceTimersByTime(5_000);
    await loader.getLiveRaceState();
    expect(calls.laps).toBe(2);
  });

  it("does not call live streams for an upcoming session", async () => {
    const calls = { drivers: 0, position: 0, intervals: 0, laps: 0, stints: 0, pit: 0, raceControl: 0 };
    const provider: OpenF1LiveProvider = {
      getSessions: async () => [{ session_key: 8, meeting_key: 2, session_name: "Race", session_type: "Race", date_start: "2026-08-23T16:00:00Z", date_end: "2026-08-23T18:00:00Z" }],
      getDrivers: async () => { calls.drivers += 1; return []; }, getPositions: async () => { calls.position += 1; return []; }, getLocations: async () => [], getIntervals: async () => { calls.intervals += 1; return []; }, getLaps: async () => { calls.laps += 1; return []; }, getStints: async () => { calls.stints += 1; return []; }, getPitStops: async () => { calls.pit += 1; return []; }, getRaceControl: async () => { calls.raceControl += 1; return []; },
    };
    const loader = createLiveStateLoader(provider);
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-08-23T15:00:00Z"));
    const state = await loader.getLiveRaceState();
    expect(state.lifecycle).toBe("UPCOMING");
    expect(calls).toEqual({ drivers: 0, position: 0, intervals: 0, laps: 0, stints: 0, pit: 0, raceControl: 0 });
  });

  it("stops all live streams after a session becomes ended and on reopen", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-08-23T15:00:00Z"));
    let ended = false;
    const calls = { sessions: 0, drivers: 0, position: 0, intervals: 0, laps: 0, stints: 0, pit: 0, raceControl: 0 };
    const provider: OpenF1LiveProvider = {
      getSessions: async () => { calls.sessions += 1; return [{ session_key: 9, meeting_key: 2, session_name: "Race", session_type: "Race", date_start: "2026-08-23T13:00:00Z", date_end: ended ? "2026-08-23T14:59:00Z" : null }]; },
      getDrivers: async () => { calls.drivers += 1; return []; }, getPositions: async () => { calls.position += 1; return []; }, getLocations: async () => [], getIntervals: async () => { calls.intervals += 1; return []; }, getLaps: async () => { calls.laps += 1; return []; }, getStints: async () => { calls.stints += 1; return []; }, getPitStops: async () => { calls.pit += 1; return []; }, getRaceControl: async () => { calls.raceControl += 1; return []; },
    };
    const loader = createLiveStateLoader(provider);
    const live = await loader.getLiveRaceState();
    expect(live.lifecycle).toBe("LIVE");
    ended = true; vi.advanceTimersByTime(30_000);
    const final = await loader.getLiveRaceState();
    expect(final.lifecycle).toBe("ENDED");
    expect(final.freshness.status).toBe("final");
    const streamCalls = { ...calls }; delete (streamCalls as Partial<typeof calls>).sessions;
    expect(streamCalls).toEqual({ drivers: 1, position: 1, intervals: 1, laps: 1, stints: 1, pit: 1, raceControl: 1 });
    await loader.getLiveRaceState();
    expect(calls).toEqual({ sessions: 2, drivers: 1, position: 1, intervals: 1, laps: 1, stints: 1, pit: 1, raceControl: 1 });
    const reopened = createLiveStateLoader(provider);
    const reopenedState = await reopened.getLiveRaceState();
    expect(reopenedState.lifecycle).toBe("ENDED");
    expect(calls).toEqual({ sessions: 3, drivers: 1, position: 1, intervals: 1, laps: 1, stints: 1, pit: 1, raceControl: 1 });
  });
});
