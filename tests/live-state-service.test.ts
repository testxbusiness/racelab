import { afterEach, describe, expect, it, vi } from "vitest";
import { createLiveStateLoader } from "@/lib/openf1/live-state-service";
import type { OpenF1LiveProvider } from "@/lib/openf1/provider";

const timestamp = "2026-08-22T14:59:58.000Z";

describe("live state loader", () => {
  afterEach(() => { vi.useRealTimers(); });

  it("retains the last valid stream when one endpoint fails", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-22T15:00:00.000Z"));
    let failIntervals = false;
    const provider: OpenF1LiveProvider = {
      getSessions: async () => [{ session_key: 1, meeting_key: 2, session_name: "Race", session_type: "Race", date_start: timestamp }],
      getDrivers: async () => [{ driver_number: 16, full_name: "Charles Leclerc", name_acronym: "LEC" }],
      getPositions: async () => [{ date: timestamp, driver_number: 16, position: 2, session_key: 1 }],
      getIntervals: async () => { if (failIntervals) throw new Error("intervals down"); return [{ date: timestamp, driver_number: 16, session_key: 1, interval: 1.2, gap_to_leader: 4.1 }]; },
      getLaps: async () => [{ session_key: 1, driver_number: 16, lap_number: 20, date_start: null, date_end: null }],
      getStints: async () => [],
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
      getIntervals: async () => { calls.intervals += 1; return [{ date: timestamp, driver_number: 16, session_key: 1, interval: 1.2, gap_to_leader: 4.1 }]; },
      getLaps: async () => { calls.laps += 1; return [{ session_key: 1, driver_number: 16, lap_number: 20, date_start: null, date_end: null }]; },
      getStints: async () => [],
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
});
