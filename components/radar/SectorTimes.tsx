import React from "react";

export type SectorValues = { sector1Seconds?: number | null; sector2Seconds?: number | null; sector3Seconds?: number | null };

export function hasSectorTimes(values: SectorValues): boolean {
  return [values.sector1Seconds, values.sector2Seconds, values.sector3Seconds].some((value) => typeof value === "number");
}

function formatSector(value: number | null | undefined): string {
  return typeof value === "number" ? value.toFixed(3) : "—";
}

export function SectorTimes({ sector1Seconds, sector2Seconds, sector3Seconds, className = "" }: SectorValues & { className?: string }) {
  return <div className={`sector-times${className ? ` ${className}` : ""}`} aria-label="Sector times">
    <span>S1 {formatSector(sector1Seconds)}</span>
    <span>S2 {formatSector(sector2Seconds)}</span>
    <span>S3 {formatSector(sector3Seconds)}</span>
  </div>;
}
