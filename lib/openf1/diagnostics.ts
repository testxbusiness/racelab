import { openF1Provider, type LiveData } from "./provider";
import { getRequestsLastMinute } from "./live-client";

const REQUEST_SPACING_MS = 450;
const waitBetweenRequests = () => new Promise<void>((resolve) => setTimeout(resolve, REQUEST_SPACING_MS));

export async function getDiagnostics(): Promise<{ ok: true; receivedAt: string; data: LiveData; requestCount: number; lastSourceTimestamp: string | null } | { ok: false; receivedAt: string; error: string }> {
  const receivedAt = new Date().toISOString();
  try {
    const sessions = await openF1Provider.getSessions();
    const sessionKey = sessions[0]?.session_key;
    if (!sessionKey) throw new Error("OpenF1 returned no latest session");
    await waitBetweenRequests();
    const drivers = await openF1Provider.getDrivers(sessionKey);
    await waitBetweenRequests();
    const positions = await openF1Provider.getPositions(sessionKey);
    await waitBetweenRequests();
    const intervals = await openF1Provider.getIntervals(sessionKey);
    await waitBetweenRequests();
    const laps = await openF1Provider.getLaps(sessionKey);
    await waitBetweenRequests();
    const raceControl = await openF1Provider.getRaceControl(sessionKey);
    const dates = [...positions, ...intervals, ...laps, ...raceControl].map((item) => item.date).sort();
    return { ok: true, receivedAt, data: { sessions, drivers, positions, intervals, laps, raceControl }, requestCount: getRequestsLastMinute(), lastSourceTimestamp: dates.at(-1) ?? null };
  } catch (error) { return { ok: false, receivedAt, error: error instanceof Error ? error.message : "OpenF1 request failed" }; }
}
