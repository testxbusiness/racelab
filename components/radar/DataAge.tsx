"use client";

import React, { useEffect, useState } from "react";

export function DataAge({ ageMs, receivedAt }: { ageMs: number | null; receivedAt: string }) {
  const [now, setNow] = useState(() => Date.parse(receivedAt));
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const elapsedSinceReceived = Math.max(0, now - Date.parse(receivedAt));
  const currentAgeMs = ageMs === null ? null : ageMs + elapsedSinceReceived;
  const value = currentAgeMs === null ? `LAST UPDATE ${new Date(receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : `DATA AGE ${(currentAgeMs / 1000).toFixed(1)}s`;
  return <span className="data-age" aria-label={value}>{value}</span>;
}
