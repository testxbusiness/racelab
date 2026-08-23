import { describe, expect, it } from "vitest";
import { createLocationService } from "@/lib/openf1/location-service";

describe("location service", () => {
  it("passes the last location timestamp cursor to the provider and returns a snapshot", async () => {
    let receivedAfter: string | null = null;
    const service = createLocationService({ getLocations: async (_sessionKey, after) => { receivedAfter = after ?? null; return [{ date: "2026-08-23T12:00:01+00:00", driver_number: 3, session_key: 1, x: 0, y: 0, z: 0 }, { date: "2026-08-23T12:00:01+00:00", driver_number: 16, session_key: 1, x: 10, y: 20, z: 30 }]; } });
    const snapshot = await service.getLocationSnapshot(1, "2026-08-23T12:00:00+00:00");
    expect(receivedAfter).toBe("2026-08-23T12:00:00+00:00");
    expect(snapshot.sourceTimestamp).toBe("2026-08-23T12:00:01+00:00");
    expect(snapshot.samples).toEqual([{ driverNumber: 16, x: 10, y: 20, z: 30, sourceTimestamp: "2026-08-23T12:00:01+00:00" }]);
  });
});
