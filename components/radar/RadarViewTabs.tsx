import React from "react";

export function RadarViewTabs() {
  return <nav className="radar-tabs" aria-label="Radar views"><a className="radar-tab radar-tab-active" href="#timing">Timing</a><span className="radar-tab radar-tab-disabled" aria-disabled="true">Map</span><a className="radar-tab" href="#events">Events</a></nav>;
}
