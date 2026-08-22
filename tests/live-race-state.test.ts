import { describe, expect, it } from "vitest";
import { calculateFreshness, composeLiveRaceState, deduplicateRaceControl } from "@/lib/f1/domain/compose-live-race-state";

const receivedAt = "2026-08-22T15:00:00.000Z";
const streams = {
  session: { status: "fresh" as const, receivedAt, sourceTimestamp: null, error: null }, drivers: { status: "fresh" as const, receivedAt, sourceTimestamp: null, error: null }, position: { status: "fresh" as const, receivedAt, sourceTimestamp: "2026-08-22T14:59:58.000Z", error: null }, intervals: { status: "fresh" as const, receivedAt, sourceTimestamp: "2026-08-22T14:59:57.000Z", error: null }, laps: { status: "fresh" as const, receivedAt, sourceTimestamp: null, error: null }, stints: { status: "fresh" as const, receivedAt, sourceTimestamp: null, error: null }, raceControl: { status: "fresh" as const, receivedAt, sourceTimestamp: "2026-08-22T14:59:59.000Z", error: null },
};
const rateBudget = { requestsLast60Seconds: 6, maxRequestsPerMinute: 60, usageRatio: 0.1, warning: "none" as const, endpoints: {} };

describe("LiveRaceState composer", () => {
  it("composes timing, latest stint data, and deduplicated race control", () => {
    const state = composeLiveRaceState({
      session: { key: 1, meetingKey: 2, name: "Race", type: "Race", countryName: "Italy", circuitName: "Monza" },
      drivers: [{ number: 16, fullName: "Charles Leclerc", acronym: "LEC", teamName: "Ferrari", teamColour: "E8002D" }],
      positions: [{ driverNumber: 16, position: 2, sourceTimestamp: "2026-08-22T14:59:58.000Z" }],
      intervals: [{ driverNumber: 16, interval: 1.2, gapToLeader: 4.1, sourceTimestamp: "2026-08-22T14:59:57.000Z" }],
      laps: [{ driverNumber: 16, lapNumber: 21, sourceTimestamp: null }],
      stints: [{ driverNumber: 16, stintNumber: 2, compound: "MEDIUM", lapStart: 15, lapEnd: 21, tyreAgeAtStart: 3 }],
      raceControl: [
        { id: "same", sourceTimestamp: "2026-08-22T14:59:59.000Z", category: "Flag", message: "GREEN FLAG", flag: "GREEN", driverNumber: null, lapNumber: 21 },
        { id: "same", sourceTimestamp: "2026-08-22T14:59:59.000Z", category: "Flag", message: "GREEN FLAG", flag: "GREEN", driverNumber: null, lapNumber: 21 },
      ], streams, rateBudget, receivedAt,
    }, Date.parse(receivedAt));
    expect(state.lapNumber).toBe(21);
    expect(state.timing[0]).toMatchObject({ position: 2, gapToLeader: 4.1, compound: "MEDIUM", tyreAge: 9 });
    expect(state.raceControl).toHaveLength(1);
    expect(state.freshness.status).toBe("live");
  });

  it("classifies data freshness and keeps event deduplication deterministic", () => {
    expect(calculateFreshness("2026-08-22T14:59:30.000Z", receivedAt, Date.parse(receivedAt)).status).toBe("stale");
    expect(deduplicateRaceControl([{ id: "a", sourceTimestamp: "2026-08-22T14:00:00Z", category: "Flag", message: null, flag: null, driverNumber: null, lapNumber: null }, { id: "a", sourceTimestamp: "2026-08-22T14:00:00Z", category: "Flag", message: null, flag: null, driverNumber: null, lapNumber: null }])).toHaveLength(1);
  });
});
