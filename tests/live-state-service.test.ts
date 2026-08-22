import { describe, expect, it } from "vitest";
import { createLiveStateLoader } from "@/lib/openf1/live-state-service";
import type { OpenF1LiveProvider } from "@/lib/openf1/provider";

const timestamp = "2026-08-22T14:59:58.000Z";

describe("live state loader", () => {
  it("retains the last valid stream when one endpoint fails", async () => {
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
    const recovered = await loader.getLiveRaceState();
    expect(initial.timing[0]?.interval).toBe(1.2);
    expect(recovered.timing[0]?.interval).toBe(1.2);
    expect(recovered.streams.intervals.status).toBe("fallback");
    expect(recovered.streams.intervals.error).toBe("intervals down");
  });
});
