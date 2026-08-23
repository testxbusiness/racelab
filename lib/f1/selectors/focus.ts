import type { LiveDriverTiming, LiveGap } from "@/lib/f1/domain/live";

export type DriverFocus = {
  timing: LiveDriverTiming;
  gapToCarAhead: LiveGap;
  gapToCarBehind: number | null;
};

export function selectDriverFocus(timing: LiveDriverTiming[], driverNumber: number | null): DriverFocus | null {
  if (driverNumber === null) return null;
  const index = timing.findIndex((item) => item.driver.number === driverNumber);
  if (index < 0) return null;
  const selected = timing[index];
  const ahead = selected.position === null || selected.position <= 1 ? undefined : timing[index - 1];
  const behind = timing[index + 1];
  const gapBetween = (other: LiveDriverTiming | undefined): number | null => {
    if (!other || typeof selected.gapToLeader !== "number" || typeof other.gapToLeader !== "number") return null;
    return Math.abs(other.gapToLeader - selected.gapToLeader);
  };
  return { timing: selected, gapToCarAhead: selected.position === 1 ? null : typeof selected.interval === "number" || typeof selected.interval === "string" ? selected.interval : gapBetween(ahead), gapToCarBehind: gapBetween(behind) };
}
