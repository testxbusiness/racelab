import { describe, expect, it } from "vitest";
import { calculateFreshness, composeLiveRaceState } from "@/lib/f1/domain/compose-live-race-state";
import { hasActiveSessionSignal, pollingPolicyFor, sessionLifecycleFor } from "@/lib/f1/domain/session-lifecycle";
import type { LiveRaceControlEvent, LiveSession } from "@/lib/f1/domain/live";

const session: LiveSession = { key: 1, meetingKey: 2, name: "Race", type: "Race", countryName: "Italy", circuitName: "Monza", dateStart: "2026-08-23T13:00:00Z", dateEnd: "2026-08-23T15:00:00Z" };
const event = (message: string, sourceTimestamp = "2026-08-23T15:01:00Z"): LiveRaceControlEvent => ({ id: message, sourceTimestamp, category: "Flag", message, flag: message.split(" ")[0] ?? null, driverNumber: null, lapNumber: 53 });

describe("session lifecycle policy", () => {
  it("classifies upcoming sessions without enabling live polling", () => {
    const lifecycle = sessionLifecycleFor({ session: { ...session, dateStart: "2026-08-23T16:00:00Z" }, raceStatus: "unavailable", raceControl: [], now: Date.parse("2026-08-23T15:00:00Z") });
    expect(lifecycle).toBe("UPCOMING");
    expect(pollingPolicyFor(lifecycle)).toMatchObject({ enabled: false, activeGroups: [] });
  });

  it("keeps normal polling for a live session", () => {
    const lifecycle = sessionLifecycleFor({ session: { ...session, dateEnd: null }, raceStatus: "green", raceControl: [], now: Date.parse("2026-08-23T14:00:00Z") });
    expect(lifecycle).toBe("LIVE");
    expect(pollingPolicyFor(lifecycle).activeGroups).toContain("position");
  });

  it("does not stop a delayed or red-flagged session only because date_end passed", () => {
    const now = Date.parse("2026-08-23T15:05:00Z");
    const raceControl = [event("RED FLAG", "2026-08-23T15:04:00Z")];
    expect(hasActiveSessionSignal(raceControl, "red-flag")).toBe(true);
    expect(sessionLifecycleFor({ session, raceStatus: "red-flag", raceControl, now })).toBe("LIVE");
    expect(sessionLifecycleFor({ session, raceStatus: "yellow", raceControl: [event("YELLOW FLAG", "2026-08-23T15:04:00Z")], now })).toBe("LIVE");
  });

  it("moves a session through finalizing to ended without stale freshness", () => {
    expect(sessionLifecycleFor({ session, raceStatus: "green", raceControl: [], now: Date.parse("2026-08-23T15:00:10Z") })).toBe("FINALIZING");
    const endedAt = Date.parse("2026-08-23T15:01:00Z");
    expect(sessionLifecycleFor({ session, raceStatus: "green", raceControl: [event("CHEQUERED FLAG")], now: endedAt })).toBe("ENDED");
    expect(calculateFreshness("2026-08-23T14:59:00Z", "2026-08-23T15:10:00Z", Date.parse("2026-08-23T15:10:00Z"), "ENDED")).toMatchObject({ ageMs: null, status: "final" });
  });

  it("makes final timing explicit in the composed state", () => {
    const health = { status: "fresh" as const, receivedAt: "2026-08-23T15:02:00Z", sourceTimestamp: null, error: null };
    const state = composeLiveRaceState({ session, drivers: [], positions: [], intervals: [], laps: [], stints: [], pitStops: [], raceControl: [event("CHEQUERED FLAG")], streams: { session: health, drivers: health, position: health, intervals: health, laps: health, stints: health, pit: health, raceControl: health }, rateBudget: { requestsLast60Seconds: 0, maxRequestsPerMinute: 60, usageRatio: 0, warning: "none", authRefreshes: 0, endpoints: {} }, receivedAt: "2026-08-23T15:02:00Z" }, Date.parse("2026-08-23T15:02:00Z"));
    expect(state.lifecycle).toBe("ENDED");
    expect(state.freshness).toMatchObject({ status: "final", ageMs: null });
    expect(state.polling).toEqual({ enabled: false, activeGroups: [] });
  });
});
