import { describe, expect, it, vi } from "vitest";
import { createLivePollingController, pollingIntervalFor, retryDelayFor, type LivePollingScheduler, type LivePollingStatus } from "@/features/connectivity/live-polling";

type Scheduled = { callback: () => void; delayMs: number };

function createScheduler() {
  let now = 1_000;
  let nextId = 1;
  const scheduled = new Map<number, Scheduled>();
  const scheduler: LivePollingScheduler = {
    now: () => now,
    setTimeout: (callback, delayMs) => { const id = nextId++; scheduled.set(id, { callback, delayMs }); return id; },
    clearTimeout: (timer) => { scheduled.delete(timer as number); },
  };
  return {
    scheduler,
    delays: () => [...scheduled.values()].map((item) => item.delayMs),
    advance: (delayMs: number) => { now += delayMs; },
    async runNext() { const [id, item] = [...scheduled.entries()][0] ?? []; if (!item) throw new Error("No scheduled poll"); scheduled.delete(id); now += item.delayMs; item.callback(); await Promise.resolve(); await Promise.resolve(); },
  };
}

describe("live polling resilience", () => {
  it("uses controlled intervals and capped exponential retry delays", () => {
    expect(pollingIntervalFor("normal")).toBe(6_000);
    expect(pollingIntervalFor("low-data")).toBe(18_000);
    expect([1, 2, 3, 4, 5].map(retryDelayFor)).toEqual([3_000, 6_000, 12_000, 24_000, 30_000]);
  });

  it("keeps valid state through intermittent provider errors and backs off", async () => {
    const harness = createScheduler();
    const received: string[] = [];
    const errors: string[] = [];
    const statuses: LivePollingStatus[] = [];
    const fetchState = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error("temporary failure")).mockRejectedValueOnce(new Error("temporary failure")).mockResolvedValueOnce("fresh-state");
    const controller = createLivePollingController({ fetchState, onState: (state) => received.push(state), onError: (error) => errors.push(error.message), onStatus: (status) => statuses.push(status), scheduler: harness.scheduler, isOnline: () => true, isVisible: () => true });

    controller.start();
    await harness.runNext();
    expect(received).toEqual([]);
    expect(errors).toEqual(["temporary failure"]);
    expect(harness.delays()).toEqual([3_000]);
    await harness.runNext();
    expect(harness.delays()).toEqual([6_000]);
    await harness.runNext();
    expect(received).toEqual(["fresh-state"]);
    expect(statuses.at(-1)).toMatchObject({ refreshing: false, retryAttempt: 0, nextRetryAt: 16_000 });
    expect(harness.delays()).toEqual([6_000]);
  });

  it("does not poll during a longer offline/background period, then refreshes immediately on resume", async () => {
    const harness = createScheduler();
    let online = false;
    let visible = true;
    const fetchState = vi.fn<() => Promise<string>>().mockResolvedValue("fresh-state");
    const controller = createLivePollingController({ fetchState, onState: () => undefined, onError: () => undefined, onStatus: () => undefined, scheduler: harness.scheduler, isOnline: () => online, isVisible: () => visible });

    controller.start();
    expect(harness.delays()).toEqual([]);
    online = true;
    controller.resume();
    expect(harness.delays()).toEqual([0]);
    visible = false;
    controller.suspend();
    expect(harness.delays()).toEqual([]);
    harness.advance(60_000);
    visible = true;
    controller.resume();
    await harness.runNext();
    expect(fetchState).toHaveBeenCalledTimes(1);
  });

  it("prevents reconnect storms when a slow request is already in flight", async () => {
    const harness = createScheduler();
    let resolveFetch!: (value: string) => void;
    const fetchState = vi.fn<() => Promise<string>>(() => new Promise<string>((resolve) => { resolveFetch = resolve; }));
    const controller = createLivePollingController({ fetchState, onState: () => undefined, onError: () => undefined, onStatus: () => undefined, scheduler: harness.scheduler, isOnline: () => true, isVisible: () => true });

    controller.start();
    await harness.runNext();
    controller.retryNow();
    controller.resume();
    expect(fetchState).toHaveBeenCalledTimes(1);
    resolveFetch("fresh-state");
    await Promise.resolve();
    await Promise.resolve();
    expect(harness.delays()).toEqual([6_000]);
  });
});
