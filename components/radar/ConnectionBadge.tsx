import React from "react";
import type { FreshnessStatus } from "@/lib/f1/domain/live";
import type { SessionLifecycle } from "@/lib/f1/domain/session-lifecycle";

const labels: Record<FreshnessStatus, string> = { live: "LIVE", delayed: "DELAYED", stale: "STALE", unavailable: "UNAVAILABLE", final: "FINAL" };

export function ConnectionBadge({ status, reconnecting = false, retrying = false, offline = false, lifecycle }: { status: FreshnessStatus; reconnecting?: boolean; retrying?: boolean; offline?: boolean; lifecycle?: SessionLifecycle }) {
  const final = lifecycle === "ENDED" || lifecycle === "FINALIZING";
  const label = final ? "FINAL" : offline ? "OFFLINE" : reconnecting ? "RECONNECTING" : retrying ? "RETRYING" : labels[status];
  const displayStatus = final ? "final" : offline ? "offline" : reconnecting || retrying ? "delayed" : status;
  return <span className={`connection-badge connection-${displayStatus}`} aria-label={`Connection ${label}`}><span aria-hidden="true">{final ? "✓" : offline ? "×" : reconnecting ? "◌" : retrying ? "!" : status === "live" ? "●" : "!"}</span> {label}</span>;
}
