import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it } from "vitest";
import { EventFeed } from "@/components/radar/EventFeed";
import { Leaderboard } from "@/components/radar/Leaderboard";
import { LiveHeader } from "@/components/radar/LiveHeader";
import { RaceStatus } from "@/components/radar/RaceStatus";
import { RadarNav } from "@/components/radar/RadarNav";
import { RadarViewTabs } from "@/components/radar/RadarViewTabs";
import type { LiveRaceState } from "@/lib/f1/domain/live";

const state: LiveRaceState = {
  session: { key: 1, meetingKey: 2, name: "Italian Grand Prix", type: "Race", countryName: "Italy", circuitName: "Monza", dateStart: "2026-08-22T14:00:00.000Z", dateEnd: null },
  lapNumber: 37, totalLaps: 53, raceStatus: "yellow", timing: [{ driver: { number: 16, fullName: "Charles Leclerc", acronym: "LEC", teamName: "Ferrari", teamColour: "E8002D" }, position: 2, gapToLeader: 1.842, interval: 1.842, compound: "MEDIUM", tyreAge: 9, lastLapSeconds: null, bestLapSeconds: null, inPit: null, retired: null, sourceTimestamp: "2026-08-22T14:59:58.000Z" }],
  raceControl: [{ id: "event", sourceTimestamp: "2026-08-22T14:59:59.000Z", category: "Flag", message: "YELLOW FLAG", flag: "YELLOW", driverNumber: null, lapNumber: 37 }], freshness: { sourceTimestamp: "2026-08-22T14:59:58.000Z", receivedAt: "2026-08-22T15:00:00.000Z", ageMs: 2000, status: "live" }, streams: {} as LiveRaceState["streams"], rateBudget: { requestsLast60Seconds: 1, maxRequestsPerMinute: 60, usageRatio: 0.01, warning: "none", authRefreshes: 0, endpoints: {} }, updatedAt: "2026-08-22T15:00:00.000Z",
};

describe("Race Radar components", () => {
  it("shows session, lap, status, connection and data age in the sticky header", () => {
    const html = renderToStaticMarkup(<LiveHeader state={state} reconnecting={false} offline={false} />);
    expect(html).toContain("Italian Grand Prix"); expect(html).toContain("LAP 37/53"); expect(html).toContain("LIVE"); expect(html).toContain("DATA AGE 2.0s");
  });
  it("renders timing, interval, team accent and tyre age without provider payloads", () => {
    const html = renderToStaticMarkup(<Leaderboard timing={state.timing} favouriteDriverNumber={16} onDriverSelect={() => undefined} />);
    expect(html).toContain("LEC"); expect(html).toContain("+1.842"); expect(html).toContain("M"); expect(html).toContain("9"); expect(html).toContain("--team-accent:#E8002D");
  });
  it("marks the favourite row and exposes a mobile driver focus entry point", () => {
    const html = renderToStaticMarkup(<Leaderboard timing={state.timing} favouriteDriverNumber={16} onDriverSelect={() => undefined} />);
    expect(html).toContain("leaderboard-row-favourite"); expect(html).toContain("favourite driver");
  });
  it("renders explicit race-control and red-flag states", () => {
    expect(renderToStaticMarkup(<RaceStatus state={state} />)).toContain("YELLOW FLAG");
    expect(renderToStaticMarkup(<RaceStatus state={{ ...state, raceStatus: "red-flag" }} />)).toContain("RED FLAG");
    expect(renderToStaticMarkup(<EventFeed events={state.raceControl} />)).toContain("LAP 37");
  });
  it("keeps the mobile shell navigable with timing, map, and events views", () => {
    const html = renderToStaticMarkup(<><RadarNav /><RadarViewTabs activeView="timing" onChange={() => undefined} /></>);
    expect(html).toContain('href="/radar"');
    expect(html).toContain('aria-label="Primary navigation"');
    expect(html).toContain('>Map<');
  });
  it("can disable the Monza-only map without disabling the timing view", () => {
    const html = renderToStaticMarkup(<RadarViewTabs activeView="timing" onChange={() => undefined} mapAvailable={false} />);
    expect(html).toContain('disabled=""'); expect(html).toContain("Track map available for Monza only");
  });
});
