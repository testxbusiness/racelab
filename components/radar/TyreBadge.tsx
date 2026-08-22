import React from "react";

const tyreLabels: Record<string, string> = { SOFT: "S", MEDIUM: "M", HARD: "H", INTERMEDIATE: "I", WET: "W" };

export function TyreBadge({ compound, age }: { compound: string | null; age: number | null }) {
  if (!compound) return <span className="tyre-badge tyre-unknown" aria-label="Tyre unavailable">? <small>—</small></span>;
  const normalized = compound.toUpperCase();
  return <span className={`tyre-badge tyre-${normalized.toLowerCase()}`} aria-label={`${compound} tyre${age === null ? "" : `, ${age} laps old`}`}><strong>{tyreLabels[normalized] ?? "?"}</strong> <small>{age ?? "—"}</small></span>;
}
