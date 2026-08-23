"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveRaceState } from "@/lib/f1/domain/live";
import { createLivePollingController, type LivePollingMode, type LivePollingStatus } from "./live-polling";

type ApiResult = { ok: true; state: LiveRaceState } | { ok: false; error: string };

export function useLiveRacePolling({ mode, onState, onError }: { mode: LivePollingMode; onState: (state: LiveRaceState) => void; onError: (error: string) => void }) {
  const [status, setStatus] = useState<LivePollingStatus>({ refreshing: false, retryAttempt: 0, nextRetryAt: null, lifecycle: "UNKNOWN", pollingEnabled: true, activePollingGroups: [] });
  const callbacksRef = useRef({ onState, onError });
  callbacksRef.current = { onState, onError };
  const controllerRef = useRef<ReturnType<typeof createLivePollingController<LiveRaceState>> | null>(null);

  useEffect(() => {
    const controller = createLivePollingController<LiveRaceState>({
      mode,
      scheduler: { now: () => Date.now(), setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs), clearTimeout: (timer) => window.clearTimeout(timer as number) },
      isOnline: () => navigator.onLine,
      isVisible: () => document.visibilityState === "visible",
      fetchState: async () => {
        const response = await fetch("/api/openf1/live", { cache: "no-store" });
        const result = (await response.json()) as ApiResult;
        if (!response.ok || !result.ok) throw new Error(result.ok ? "Live provider unavailable" : result.error);
        return result.state;
      },
      onState: (state) => callbacksRef.current.onState(state),
      onError: (error) => callbacksRef.current.onError(error.message),
      onStatus: setStatus,
      getPollingPolicy: (state) => ({ lifecycle: state.lifecycle, policy: state.polling }),
    });
    controllerRef.current = controller;
    const onOnline = () => controller.resume();
    const onOffline = () => controller.suspend();
    const onVisibilityChange = () => document.visibilityState === "visible" ? controller.resume() : controller.suspend();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibilityChange);
    controller.start();
    return () => {
      controller.stop();
      controllerRef.current = null;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => { controllerRef.current?.setMode(mode); }, [mode]);

  return { ...status, retryNow: () => controllerRef.current?.retryNow() };
}
