import { describe, expect, it } from "vitest";
import { mapDriver, mapInterval, mapLocation, mapPitStop, mapRaceControl, mapStint } from "@/lib/openf1/mappers";

describe("OpenF1 response mappers", () => {
  it("maps provider names into the RaceLab domain without provider extras", () => {
    expect(mapDriver({ driver_number: 16, full_name: "Charles Leclerc", name_acronym: "LEC", team_name: "Ferrari", team_colour: "E8002D", provider_only: "discarded" })).toEqual({ number: 16, fullName: "Charles Leclerc", acronym: "LEC", teamName: "Ferrari", teamColour: "E8002D" });
  });

  it("creates stable race-control ids and tyre state", () => {
    expect(mapRaceControl({ date: "2026-08-22T15:00:00+00:00", session_key: 1, category: "Flag", message: "GREEN FLAG", flag: "GREEN", driver_number: null, lap_number: 12 }).id).toContain("GREEN FLAG");
    expect(mapStint({ compound: "MEDIUM", driver_number: 16, lap_end: 20, lap_start: 5, meeting_key: 2, session_key: 1, stint_number: 2, tyre_age_at_start: 3 })).toMatchObject({ driverNumber: 16, compound: "MEDIUM", tyreAgeAtStart: 3 });
  });
  it("maps location coordinates into the domain", () => {
    expect(mapLocation({ date: "2026-08-23T12:00:00+00:00", driver_number: 16, session_key: 1, x: 10, y: 20, z: 30 })).toEqual({ driverNumber: 16, x: 10, y: 20, z: 30, sourceTimestamp: "2026-08-23T12:00:00+00:00" });
  });
  it("maps pit stops into the domain", () => {
    expect(mapPitStop({ date: "2026-08-22T14:30:00.000Z", driver_number: 16, lap_number: 10, meeting_key: 2, session_key: 1, lane_duration: 22.1, stop_duration: 2.4 })).toEqual({ driverNumber: 16, lapNumber: 10, sourceTimestamp: "2026-08-22T14:30:00.000Z", laneDurationSeconds: 22.1, stopDurationSeconds: 2.4 });
  });
  it("preserves OpenF1 lapped interval labels", () => {
    expect(mapInterval({ date: "2026-08-23T12:00:00+00:00", driver_number: 16, session_key: 1, interval: "+1 LAP", gap_to_leader: "+2 LAPS" })).toMatchObject({ interval: "+1 LAP", gapToLeader: "+2 LAPS" });
  });
});
