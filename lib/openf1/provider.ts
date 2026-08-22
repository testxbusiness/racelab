import "server-only";
import { z } from "zod";
import { emptyResultSchema, listSchema, driverSchema, intervalSchema, lapSchema, positionSchema, raceControlSchema, sessionSchema, type OpenF1Driver, type OpenF1Interval, type OpenF1Lap, type OpenF1Position, type OpenF1RaceControl, type OpenF1Session } from "./schemas";
import { openF1Fetch } from "./live-client";

async function getValidated<T>(path: string, schema: z.ZodType<T[]>): Promise<T[]> {
  const response = await openF1Fetch(path);
  const payload: unknown = await response.json();
  if (emptyResultSchema.safeParse(payload).success) return [];
  const parsed = schema.safeParse(payload);
  if (!parsed.success) throw new Error(`OpenF1 payload validation failed for ${path}`);
  return parsed.data;
}

export const openF1Provider = {
  getSessions: () => getValidated("sessions?session_key=latest", listSchema(sessionSchema)),
  getDrivers: (sessionKey: number) => getValidated(`drivers?session_key=${sessionKey}`, listSchema(driverSchema)),
  getPositions: (sessionKey: number) => getValidated(`position?session_key=${sessionKey}`, listSchema(positionSchema)),
  getIntervals: (sessionKey: number) => getValidated(`intervals?session_key=${sessionKey}`, listSchema(intervalSchema)),
  getLaps: (sessionKey: number) => getValidated(`laps?session_key=${sessionKey}`, listSchema(lapSchema)),
  getRaceControl: (sessionKey: number) => getValidated(`race_control?session_key=${sessionKey}`, listSchema(raceControlSchema)),
};

export type LiveData = { sessions: OpenF1Session[]; drivers: OpenF1Driver[]; positions: OpenF1Position[]; intervals: OpenF1Interval[]; laps: OpenF1Lap[]; raceControl: OpenF1RaceControl[] };
