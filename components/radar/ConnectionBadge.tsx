import React from "react";
import type { FreshnessStatus } from "@/lib/f1/domain/live";

const labels: Record<FreshnessStatus, string> = { live: "LIVE", delayed: "DELAYED", stale: "STALE", unavailable: "UNAVAILABLE" };

export function ConnectionBadge({ status, reconnecting = false, offline = false }: { status: FreshnessStatus; reconnecting?: boolean; offline?: boolean }) {
  const label = offline ? "OFFLINE" : reconnecting ? "RECONNECTING" : labels[status];
  return <span className={`connection-badge connection-${offline ? "offline" : status}`} aria-label={`Connection ${label}`}><span aria-hidden="true">{offline ? "×" : reconnecting ? "◌" : status === "live" ? "●" : "!"}</span> {label}</span>;
}
