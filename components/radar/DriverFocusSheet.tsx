"use client";

import React from "react";
import type { DriverFocus } from "@/lib/f1/selectors/focus";
import { TyreBadge } from "./TyreBadge";
import type { LiveGap, LiveRaceState } from "@/lib/f1/domain/live";
import { SectorTimes } from "./SectorTimes";
import { DriverPortrait } from "./DriverPortrait";
import { TeamLogo } from "./TeamLogo";
import Image from "next/image";
import { currentCarPath } from "@/lib/f1/assets";

function value(value: number | LiveGap, suffix = "s"): string { return value === null ? "—" : typeof value === "string" ? value : `${value.toFixed(3)}${suffix}`; }
function lapTime(value: number | null): string { if (value === null) return "—"; const minutes = Math.floor(value / 60); return `${minutes}:${(value - minutes * 60).toFixed(3).padStart(6, "0")}`; }

export function DriverFocusSheet({ focus, sessionDateStart, lifecycle, isFavourite, onClose, onSetFavourite }: { focus: DriverFocus | null; sessionDateStart: string | null; lifecycle: LiveRaceState["lifecycle"]; isFavourite: boolean; onClose: () => void; onSetFavourite: () => void }) {
  if (!focus) return null;
  const { timing } = focus;
  return <div className="focus-backdrop" role="presentation" onClick={onClose}>
    <section className="focus-sheet" role="dialog" aria-modal="true" aria-labelledby="focus-title" onClick={(event) => event.stopPropagation()}>
      <div className="focus-sheet-handle" aria-hidden="true" />
      <div className="focus-hero" style={{ "--focus-accent": timing.driver.teamColour ? `#${timing.driver.teamColour.replace("#", "")}` : "var(--accent)" } as React.CSSProperties}>
        <div className="focus-hero-copy"><p className="eyebrow">DRIVER FOCUS · {timing.driver.acronym}</p><h2 id="focus-title">{timing.driver.fullName}</h2><span className="focus-team-name"><TeamLogo teamName={timing.driver.teamName} />{timing.driver.teamName ?? "Team unavailable"}</span></div><DriverPortrait acronym={timing.driver.acronym} className="focus-driver-portrait" /><span className="driver-number" aria-label={`Car number ${timing.driver.number}`}>{timing.driver.number}</span>
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Close driver focus">×</button>
      </div>
      {currentCarPath(timing.driver.teamName, sessionDateStart) ? <div className="focus-car-strip"><Image src={currentCarPath(timing.driver.teamName, sessionDateStart)!} alt="" width={720} height={160} sizes="(min-width: 700px) 620px, 100vw" /></div> : null}
      <button type="button" className={`favourite-action${isFavourite ? " favourite-action-active" : ""}`} onClick={onSetFavourite}>{isFavourite ? "★ Favourite driver" : "☆ Set as favourite"}</button>
      <div className="focus-grid">
        <div><span>POSITION</span><strong>{timing.position ?? "—"}</strong></div>
        <div><span>GAP TO LEADER</span><strong>{value(timing.gapToLeader)}</strong></div>
        <div><span>CAR AHEAD</span><strong>{value(focus.gapToCarAhead)}</strong></div>
        <div><span>CAR BEHIND</span><strong>{value(focus.gapToCarBehind)}</strong></div>
        <div><span>LAST LAP</span><strong>{lapTime(timing.lastLapSeconds)}</strong></div>
        <div><span>BEST LAP</span><strong>{lapTime(timing.bestLapSeconds)}</strong><small className="focus-best-lap-meta">{timing.bestLapNumber === null ? "—" : `LAP ${timing.bestLapNumber} · ${lifecycle === "ENDED" ? "Official" : "Provisional"}`}</small></div>
        <div className="focus-sectors"><span>LAST LAP SECTORS</span><SectorTimes sector1Seconds={timing.sector1Seconds} sector2Seconds={timing.sector2Seconds} sector3Seconds={timing.sector3Seconds} /></div>
        <div><span>PIT STOPS</span><strong>{timing.pitStops ?? "—"}</strong></div>
        <div className="focus-tyre"><span>TYRE / STINT</span><TyreBadge compound={timing.compound} age={timing.tyreAge} /></div>
      </div>
    </section>
  </div>;
}
