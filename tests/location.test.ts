import { describe, expect, it } from "vitest";
import { expandLocationBounds, mergeLatestLocationSamples, normalizeLocationSample } from "@/lib/f1/domain/location";
import type { LiveLocationSample } from "@/lib/f1/domain/live";
import { locationStatusFor } from "@/features/track/useTrackMapData";

const sample = (driverNumber: number, x: number, y: number, date: string): LiveLocationSample => ({ driverNumber, x, y, z: 0, sourceTimestamp: date });

describe("track location domain", () => {
  it("normalizes samples into the static map viewBox and expands bounds", () => {
    const bounds = expandLocationBounds(null, [sample(1, 0, 0, "2026-08-23T12:00:00Z"), sample(2, 100, 200, "2026-08-23T12:00:01Z")]);
    expect(bounds).not.toBeNull();
    expect(normalizeLocationSample(sample(1, 0, 0, "2026-08-23T12:00:00Z"), bounds!)).toMatchObject({ x: 48, y: 712 });
  });
  it("keeps only the latest sample per driver", () => {
    const old = "2026-08-23T12:00:00Z";
    const fresh = "2026-08-23T12:00:01Z";
    expect(mergeLatestLocationSamples([sample(1, 1, 1, old)], [sample(1, 2, 2, fresh), sample(2, 3, 3, fresh)])).toHaveLength(2);
  });
  it("classifies map freshness without treating stale data as live", () => {
    const now = Date.parse("2026-08-23T12:00:20Z");
    expect(locationStatusFor("2026-08-23T12:00:15Z", now)).toBe("live");
    expect(locationStatusFor("2026-08-23T11:59:55Z", now)).toBe("stale");
    expect(locationStatusFor(null, now)).toBe("unavailable");
  });
  it("keeps a 20-car location merge bounded to one marker per driver", () => {
    const incoming = Array.from({ length: 20_000 }, (_, index) => sample((index % 20) + 1, index, index, `2026-08-23T12:${String(Math.floor(index / 60) % 60).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}Z`));
    expect(mergeLatestLocationSamples([], incoming)).toHaveLength(20);
  });
});
