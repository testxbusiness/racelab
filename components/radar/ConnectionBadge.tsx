import React from "react";
import type { FreshnessStatus } from "@/lib/f1/domain/live";

const labels: Record<FreshnessStatus, string> = { live: "LIVE", delayed: "DELAYED", stale: "STALE", unavailable: "UNAVAILABLE" };

export function ConnectionBadge({ status, reconnecting = false, retrying = false, offline = false }: { status: FreshnessStatus; reconnecting?: boolean; retrying?: boolean; offline?: boolean }) {
  const label = offline ? "OFFLINE" : reconnecting ? "RECONNECTING" : retrying ? "RETRYING" : labels[status];
  const displayStatus = offline ? "offline" : reconnecting || retrying ? "delayed" : status;
  return <span className={`connection-badge connection-${displayStatus}`} aria-label={`Connection ${label}`}><span aria-hidden="true">{offline ? "×" : reconnecting ? "◌" : retrying ? "!" : status === "live" ? "●" : "!"}</span> {label}</span>;
}
