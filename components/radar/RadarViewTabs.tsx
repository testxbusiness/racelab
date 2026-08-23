"use client";

import React from "react";

export type RadarView = "timing" | "map" | "events";

export function RadarViewTabs({ activeView, onChange, mapAvailable = true }: { activeView: RadarView; onChange: (view: RadarView) => void; mapAvailable?: boolean }) {
  return <nav className="radar-tabs" aria-label="Radar views"><button type="button" className={`radar-tab${activeView === "timing" ? " radar-tab-active" : ""}`} onClick={() => onChange("timing")}>Timing</button><button type="button" className={`radar-tab${activeView === "map" ? " radar-tab-active" : ""}${!mapAvailable ? " radar-tab-disabled" : ""}`} onClick={() => { if (mapAvailable) onChange("map"); }} disabled={!mapAvailable} aria-label={mapAvailable ? "Open track map" : "Track map unavailable for this circuit"}>Map</button><button type="button" className={`radar-tab${activeView === "events" ? " radar-tab-active" : ""}`} onClick={() => onChange("events")}>Events</button></nav>;
}
