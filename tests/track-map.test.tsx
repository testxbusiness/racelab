import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it } from "vitest";
import { TrackMap } from "@/components/track/TrackMap";
import { getTrackGeometry } from "@/components/track/track-geometries";

describe("TrackMap", () => {
  it("renders static Monza geometry, driver markers, favourite emphasis, and selected labels", () => {
    const html = renderToStaticMarkup(<TrackMap markers={[{ driverNumber: 16, acronym: "LEC", teamColour: "E8002D", x: 120, y: 300 }]} favouriteDriverNumber={16} selectedDriverNumber={16} onSelectDriver={() => undefined} />);
    expect(html).toContain("Monza track map"); expect(html).toContain("track-marker-favourite"); expect(html).toContain("track-marker-ring"); expect(html).toContain("LEC");
  });
  it("renders the preprocessed Zandvoort geometry", () => {
    const html = renderToStaticMarkup(<TrackMap geometry={getTrackGeometry("Zandvoort")!} markers={[]} favouriteDriverNumber={null} selectedDriverNumber={null} onSelectDriver={() => undefined} />);
    expect(html).toContain("Zandvoort track map"); expect(html).toContain("M181 300");
  });
});
