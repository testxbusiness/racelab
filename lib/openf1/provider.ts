import "server-only";
import { z } from "zod";
import { emptyResultSchema, listSchema, driverSchema, intervalSchema, lapSchema, locationSchema, positionSchema, raceControlSchema, sessionSchema, stintSchema, type OpenF1Driver, type OpenF1Interval, type OpenF1Lap, type OpenF1Location, type OpenF1Position, type OpenF1RaceControl, type OpenF1Session, type OpenF1Stint } from "./schemas";
import { openF1Fetch, recordOpenF1ProviderResult, recordOpenF1ValidationFailure } from "./live-client";
import { ProviderError } from "./errors";

function latestSourceTimestamp(records: unknown[]): string | null {
  const timestamps: string[] = [];
  for (const record of records) {
    if (typeof record !== "object" || record === null) continue;
    const fields = record as Record<string, unknown>;
    for (const key of ["date", "date_start", "date_end"]) {
      const value = fields[key];
      if (typeof value === "string") timestamps.push(value);
    }
  }
  return timestamps.sort().at(-1) ?? null;
}

async function getValidated<T>(path: string, schema: z.ZodType<T[]>): Promise<T[]> {
  const response = await openF1Fetch(path);
  const payload: unknown = await response.json();
  if (emptyResultSchema.safeParse(payload).success) {
    recordOpenF1ProviderResult(path, 0, null);
    return [];
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    recordOpenF1ValidationFailure(path, parsed.error.issues.length);
    throw new ProviderError("validation", `OpenF1 payload validation failed for ${path}`, path, 502);
  }
  const sourceTimestamp = latestSourceTimestamp(parsed.data);
  recordOpenF1ProviderResult(path, parsed.data.length, sourceTimestamp);
  return parsed.data;
}

export const openF1Provider = {
  getSessions: () => getValidated("sessions?session_key=latest", listSchema(sessionSchema)),
  getDrivers: (sessionKey: number) => getValidated(`drivers?session_key=${sessionKey}`, listSchema(driverSchema)),
  getPositions: (sessionKey: number) => getValidated(`position?session_key=${sessionKey}`, listSchema(positionSchema)),
  getLocations: (sessionKey: number, after: string | null = null) => getValidated(`location?${new URLSearchParams({ session_key: String(sessionKey), ...(after ? { "date>": after } : {}) })}`, listSchema(locationSchema)),
  getIntervals: (sessionKey: number) => getValidated(`intervals?session_key=${sessionKey}`, listSchema(intervalSchema)),
  getLaps: (sessionKey: number) => getValidated(`laps?session_key=${sessionKey}`, listSchema(lapSchema)),
  getStints: (sessionKey: number) => getValidated(`stints?session_key=${sessionKey}`, listSchema(stintSchema)),
  getRaceControl: (sessionKey: number) => getValidated(`race_control?session_key=${sessionKey}`, listSchema(raceControlSchema)),
};

export type OpenF1LiveProvider = typeof openF1Provider;
export type LiveData = { sessions: OpenF1Session[]; drivers: OpenF1Driver[]; positions: OpenF1Position[]; locations: OpenF1Location[]; intervals: OpenF1Interval[]; laps: OpenF1Lap[]; stints: OpenF1Stint[]; raceControl: OpenF1RaceControl[] };
