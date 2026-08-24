import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it } from "vitest";
import { EventFeed } from "@/components/radar/EventFeed";
import { Leaderboard } from "@/components/radar/Leaderboard";
import { LiveHeader } from "@/components/radar/LiveHeader";
import { RaceStatus } from "@/components/radar/RaceStatus";
import { FastestLapCard } from "@/components/radar/FastestLapCard";
import { DriverFocusSheet } from "@/components/radar/DriverFocusSheet";
import { RadarNav } from "@/components/radar/RadarNav";
import { RadarViewTabs } from "@/components/radar/RadarViewTabs";
import type { LiveRaceState } from "@/lib/f1/domain/live";

const state: LiveRaceState = {
  session: { key: 1, meetingKey: 2, name: "Italian Grand Prix", type: "Race", countryName: "Italy", circuitName: "Monza", dateStart: "2026-08-22T14:00:00.000Z", dateEnd: null },
  lapNumber: 37, totalLaps: 53, raceStatus: "yellow", fastestLap: { driverNumber: 16, lapNumber: 32, durationSeconds: 81.234, sourceTimestamp: "2026-08-22T14:30:00.000Z" }, timing: [{ driver: { number: 16, fullName: "Charles Leclerc", acronym: "LEC", teamName: "Ferrari", teamColour: "E8002D" }, position: 2, gapToLeader: 1.842, interval: 1.842, compound: "MEDIUM", tyreAge: 9, lastLapSeconds: null, sector1Seconds: 27.123, sector2Seconds: 38.456, sector3Seconds: 26.789, bestLapSeconds: 80.901, bestLapNumber: 14, inPit: null, retired: null, pitStops: 2, sourceTimestamp: "2026-08-22T14:59:58.000Z" }],
  raceControl: [{ id: "event", sourceTimestamp: "2026-08-22T14:59:59.000Z", category: "Flag", message: "YELLOW FLAG", flag: "YELLOW", driverNumber: null, lapNumber: 37 }], freshness: { sourceTimestamp: "2026-08-22T14:59:58.000Z", receivedAt: "2026-08-22T15:00:00.000Z", ageMs: 2000, status: "live" }, streams: {} as LiveRaceState["streams"], rateBudget: { requestsLast60Seconds: 1, maxRequestsPerMinute: 60, usageRatio: 0.01, warning: "none", authRefreshes: 0, endpoints: {} }, updatedAt: "2026-08-22T15:00:00.000Z", lifecycle: "LIVE", polling: { enabled: true, activeGroups: ["position", "intervals", "raceControl", "laps", "stints", "pit", "weather", "location"] },
};

describe("Race Radar components", () => {
  it("shows session, lap, status, connection and data age in the sticky header", () => {
    const html = renderToStaticMarkup(<LiveHeader state={state} reconnecting={false} offline={false} />);
    expect(html).toContain("Italian Grand Prix"); expect(html).toContain("LAP 37/53"); expect(html).toContain("LIVE"); expect(html).toContain("DATA AGE 2.0s");
  });
  it("marks preserved timing as retrying without removing the live header", () => {
    const html = renderToStaticMarkup(<LiveHeader state={state} reconnecting={false} retrying offline={false} />);
    expect(html).toContain("RETRYING"); expect(html).toContain("Italian Grand Prix");
  });
  it("renders timing, interval, team accent and tyre age without provider payloads", () => {
    const html = renderToStaticMarkup(<Leaderboard timing={state.timing} favouriteDriverNumber={16} onDriverSelect={() => undefined} />);
    expect(html).toContain("LEC"); expect(html).toContain("+1.842"); expect(html).toContain("S1 27.123"); expect(html).toContain("S2 38.456"); expect(html).toContain("S3 26.789"); expect(html).toContain("M"); expect(html).toContain("9"); expect(html).toContain("PITS 2"); expect(html).toContain("--team-accent:#E8002D");
  });
  it("renders the provisional fastest lap with driver, team and lap number", () => {
    const html = renderToStaticMarkup(<FastestLapCard state={state} />);
    expect(html).toContain("FASTEST LAP"); expect(html).toContain("1:21.234"); expect(html).toContain("LEC · Ferrari"); expect(html).toContain("LAP 32");
  });
  it("renders a driver's personal best lap and lap number in the focus card", () => {
    const html = renderToStaticMarkup(<DriverFocusSheet focus={{ timing: state.timing[0], gapToCarAhead: 1.2, gapToCarBehind: 2.3 }} sessionDateStart="2026-08-22T14:00:00.000Z" lifecycle="LIVE" isFavourite={false} onClose={() => undefined} onSetFavourite={() => undefined} />);
    expect(html).toContain("BEST LAP"); expect(html).toContain("1:20.901"); expect(html).toContain("LAST LAP"); expect(html).toContain("—"); expect(html).toContain("LAP 14 · Provisional");
  });
  it("marks the fastest lap official once the session has ended", () => {
    const html = renderToStaticMarkup(<FastestLapCard state={{ ...state, lifecycle: "ENDED" }} />);
    expect(html).toContain("Official"); expect(html).not.toContain("Provisional");
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
  it("can disable the map for unsupported circuits without disabling the timing view", () => {
    const html = renderToStaticMarkup(<RadarViewTabs activeView="timing" onChange={() => undefined} mapAvailable={false} />);
    expect(html).toContain('disabled=""'); expect(html).toContain("Track map unavailable for this circuit");
  });
});
