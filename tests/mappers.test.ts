import { describe, expect, it } from "vitest";
import { mapDriver, mapRaceControl, mapStint } from "@/lib/openf1/mappers";

describe("OpenF1 response mappers", () => {
  it("maps provider names into the RaceLab domain without provider extras", () => {
    expect(mapDriver({ driver_number: 16, full_name: "Charles Leclerc", name_acronym: "LEC", team_name: "Ferrari", team_colour: "E8002D", provider_only: "discarded" })).toEqual({ number: 16, fullName: "Charles Leclerc", acronym: "LEC", teamName: "Ferrari", teamColour: "E8002D" });
  });

  it("creates stable race-control ids and tyre state", () => {
    expect(mapRaceControl({ date: "2026-08-22T15:00:00+00:00", session_key: 1, category: "Flag", message: "GREEN FLAG", flag: "GREEN", driver_number: null, lap_number: 12 }).id).toContain("GREEN FLAG");
    expect(mapStint({ compound: "MEDIUM", driver_number: 16, lap_end: 20, lap_start: 5, meeting_key: 2, session_key: 1, stint_number: 2, tyre_age_at_start: 3 })).toMatchObject({ driverNumber: 16, compound: "MEDIUM", tyreAgeAtStart: 3 });
  });
});
