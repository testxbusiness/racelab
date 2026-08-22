import React from "react";

export function DataAge({ ageMs, receivedAt }: { ageMs: number | null; receivedAt: string }) {
  const value = ageMs === null ? `LAST UPDATE ${new Date(receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : `DATA AGE ${(ageMs / 1000).toFixed(1)}s`;
  return <span className="data-age" aria-label={value}>{value}</span>;
}
