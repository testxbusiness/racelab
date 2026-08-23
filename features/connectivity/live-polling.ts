import type { SessionLifecycle, SessionPollingPolicy } from "@/lib/f1/domain/session-lifecycle";

export type LivePollingMode = "normal" | "low-data";

export type LivePollingStatus = {
  refreshing: boolean;
  retryAttempt: number;
  nextRetryAt: number | null;
  lifecycle: SessionLifecycle | "UNKNOWN";
  pollingEnabled: boolean;
  activePollingGroups: readonly string[];
};

export type LivePollingScheduler = {
  now(): number;
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(timer: unknown): void;
};

export type LivePollingControllerOptions<T> = {
  fetchState(): Promise<T>;
  onState(state: T): void;
  onError(error: Error): void;
  onStatus(status: LivePollingStatus): void;
  scheduler: LivePollingScheduler;
  isOnline(): boolean;
  isVisible(): boolean;
  mode?: LivePollingMode;
  getPollingPolicy?: (state: T) => { lifecycle: SessionLifecycle; policy: SessionPollingPolicy };
};

const NORMAL_INTERVAL_MS = 6_000;
const LOW_DATA_INTERVAL_MS = 18_000;
const INITIAL_BACKOFF_MS = 3_000;
const MAX_BACKOFF_MS = 30_000;

export function pollingIntervalFor(mode: LivePollingMode): number {
  return mode === "low-data" ? LOW_DATA_INTERVAL_MS : NORMAL_INTERVAL_MS;
}

export function retryDelayFor(attempt: number): number {
  return Math.min(INITIAL_BACKOFF_MS * 2 ** Math.max(0, attempt - 1), MAX_BACKOFF_MS);
}

export function createLivePollingController<T>(options: LivePollingControllerOptions<T>) {
  let mode = options.mode ?? "normal";
  let stopped = true;
  let inFlight = false;
  let retryAttempt = 0;
  let timer: unknown = null;

  let policySnapshot: Pick<LivePollingStatus, "lifecycle" | "pollingEnabled" | "activePollingGroups"> = { lifecycle: "UNKNOWN", pollingEnabled: true, activePollingGroups: [] };
  const publish = (refreshing: boolean, nextRetryAt: number | null) => options.onStatus({ refreshing, retryAttempt, nextRetryAt, ...policySnapshot });
  const clearScheduled = () => { if (timer !== null) { options.scheduler.clearTimeout(timer); timer = null; } };
  const canPoll = () => !stopped && options.isOnline() && options.isVisible();

  const schedule = (delayMs: number) => {
    clearScheduled();
    if (!canPoll()) { publish(false, null); return; }
    const nextRetryAt = delayMs ? options.scheduler.now() + delayMs : null;
    publish(false, nextRetryAt);
    timer = options.scheduler.setTimeout(() => { timer = null; void poll(); }, delayMs);
  };

  const poll = async () => {
    if (!canPoll() || inFlight) return;
    inFlight = true;
    publish(true, null);
    try {
      const state = await options.fetchState();
      if (stopped) return;
      retryAttempt = 0;
      if (options.getPollingPolicy) {
        const next = options.getPollingPolicy(state);
        policySnapshot = { lifecycle: next.lifecycle, pollingEnabled: next.policy.enabled, activePollingGroups: next.policy.activeGroups };
      }
      options.onState(state);
      if (!policySnapshot.pollingEnabled) {
        stopped = true;
        clearScheduled();
        publish(false, null);
        return;
      }
      schedule(pollingIntervalFor(mode));
    } catch (error) {
      if (stopped) return;
      retryAttempt += 1;
      options.onError(error instanceof Error ? error : new Error("Live provider unavailable"));
      schedule(retryDelayFor(retryAttempt));
    } finally {
      inFlight = false;
    }
  };

  return {
    start: () => { stopped = false; schedule(0); },
    stop: () => { stopped = true; clearScheduled(); publish(false, null); },
    retryNow: () => { if (!inFlight) schedule(0); },
    resume: () => { if (!inFlight) schedule(0); },
    suspend: () => { clearScheduled(); publish(false, null); },
    setMode: (nextMode: LivePollingMode) => { mode = nextMode; if (!inFlight) schedule(0); },
  };
}
