"use client";

import React from "react";
import type { DriverFocus } from "@/lib/f1/selectors/focus";
import { TyreBadge } from "./TyreBadge";
import type { LiveGap } from "@/lib/f1/domain/live";

function value(value: number | LiveGap, suffix = "s"): string { return value === null ? "—" : typeof value === "string" ? value : `${value.toFixed(3)}${suffix}`; }

export function DriverFocusSheet({ focus, isFavourite, onClose, onSetFavourite }: { focus: DriverFocus | null; isFavourite: boolean; onClose: () => void; onSetFavourite: () => void }) {
  if (!focus) return null;
  const { timing } = focus;
  return <div className="focus-backdrop" role="presentation" onClick={onClose}>
    <section className="focus-sheet" role="dialog" aria-modal="true" aria-labelledby="focus-title" onClick={(event) => event.stopPropagation()}>
      <div className="focus-sheet-handle" aria-hidden="true" />
      <div className="focus-hero" style={{ "--focus-accent": timing.driver.teamColour ? `#${timing.driver.teamColour.replace("#", "")}` : "var(--accent)" } as React.CSSProperties}>
        <div className="focus-hero-copy"><p className="eyebrow">DRIVER FOCUS · {timing.driver.acronym}</p><h2 id="focus-title">{timing.driver.fullName}</h2><span>{timing.driver.teamName ?? "Team unavailable"}</span></div><span className="driver-number" aria-label={`Car number ${timing.driver.number}`}>{timing.driver.number}</span>
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Close driver focus">×</button>
      </div>
      <button type="button" className={`favourite-action${isFavourite ? " favourite-action-active" : ""}`} onClick={onSetFavourite}>{isFavourite ? "★ Favourite driver" : "☆ Set as favourite"}</button>
      <div className="focus-grid">
        <div><span>POSITION</span><strong>{timing.position ?? "—"}</strong></div>
        <div><span>GAP TO LEADER</span><strong>{value(timing.gapToLeader)}</strong></div>
        <div><span>CAR AHEAD</span><strong>{value(focus.gapToCarAhead)}</strong></div>
        <div><span>CAR BEHIND</span><strong>{value(focus.gapToCarBehind)}</strong></div>
        <div><span>LAST LAP</span><strong>{value(timing.lastLapSeconds)}</strong></div>
        <div><span>BEST LAP</span><strong>{value(timing.bestLapSeconds)}</strong></div>
        <div><span>PIT STOPS</span><strong>{timing.pitStops ?? "—"}</strong></div>
        <div className="focus-tyre"><span>TYRE / STINT</span><TyreBadge compound={timing.compound} age={timing.tyreAge} /></div>
      </div>
    </section>
  </div>;
}
