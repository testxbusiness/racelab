import { describe, expect, it } from "vitest";
import { selectDriverFocus } from "@/lib/f1/selectors/focus";
import type { LiveDriverTiming } from "@/lib/f1/domain/live";

const driver = (number: number, position: number, gapToLeader: number): LiveDriverTiming => ({ driver: { number, fullName: `Driver ${number}`, acronym: `D${number}`, teamName: "Team", teamColour: null }, position, gapToLeader, interval: position === 1 ? 0 : 2.5, compound: "MEDIUM", tyreAge: 8, lastLapSeconds: 81.2, bestLapSeconds: 80.9, bestLapNumber: 14, inPit: null, retired: null, pitStops: 0, sourceTimestamp: null });

describe("driver focus selectors", () => {
  it("derives the gaps around a selected driver from the composed timing", () => {
    const focus = selectDriverFocus([driver(1, 1, 0), driver(2, 2, 2.5), driver(3, 3, 5.1)], 2);
    expect(focus?.gapToCarAhead).toBe(2.5);
    expect(focus?.gapToCarBehind).toBeCloseTo(2.6);
  });
  it("returns no focus for an unknown driver", () => expect(selectDriverFocus([], 16)).toBeNull());
});
