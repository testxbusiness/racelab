import { describe, expect, it } from "vitest";
import { createLastKnownLiveState, parseLastKnownLiveState } from "@/lib/pwa/last-known-live";
import type { LiveRaceState } from "@/lib/f1/domain/live";

const state = { freshness: { sourceTimestamp: "2026-08-23T12:00:00Z" } } as LiveRaceState;

describe("last-known live state", () => {
  it("persists an explicit saved timestamp and source timestamp", () => {
    expect(createLastKnownLiveState(state, "2026-08-23T12:00:05Z")).toEqual({ state, savedAt: "2026-08-23T12:00:05Z", sourceTimestamp: "2026-08-23T12:00:00Z" });
  });

  it("rejects values without a saved timestamp", () => {
    expect(parseLastKnownLiveState(JSON.stringify({ state }))).toBeNull();
    expect(parseLastKnownLiveState(JSON.stringify({ state, savedAt: "not-a-timestamp" }))).toBeNull();
    expect(parseLastKnownLiveState("not-json")).toBeNull();
  });
});
