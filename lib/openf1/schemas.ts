import { z } from "zod";

const date = z.string().datetime({ offset: true });

export const sessionSchema = z.object({
  session_key: z.number(), meeting_key: z.number(), session_name: z.string(),
  session_type: z.string(), date_start: date, date_end: date.nullable().optional(),
  country_name: z.string().optional(), circuit_short_name: z.string().optional(), year: z.number().optional(),
}).passthrough();

export const driverSchema = z.object({
  driver_number: z.number(), full_name: z.string(), name_acronym: z.string(), team_name: z.string().optional(),
  team_colour: z.string().optional(), headshot_url: z.string().nullable().optional(),
}).passthrough();

export const positionSchema = z.object({
  date, driver_number: z.number(), position: z.number(), session_key: z.number(),
}).passthrough();

export const intervalSchema = z.object({
  date, driver_number: z.number(), session_key: z.number(), interval: z.number().nullable(),
  gap_to_leader: z.number().nullable(),
}).passthrough();

export const raceControlSchema = z.object({
  date, session_key: z.number(), category: z.string(),
  message: z.string().optional(), flag: z.string().nullable().optional(), driver_number: z.number().nullable().optional(), lap_number: z.number().nullable().optional(),
}).passthrough();
export const lapSchema = z.object({
  date: date.optional(), session_key: z.number(), driver_number: z.number(), lap_number: z.number(),
  date_start: date.nullable().optional(), date_end: date.nullable().optional(),
}).passthrough();
export const stintSchema = z.object({
  compound: z.string(), driver_number: z.number(), lap_end: z.number(), lap_start: z.number(), meeting_key: z.number(), session_key: z.number(), stint_number: z.number(), tyre_age_at_start: z.number(),
}).passthrough();

export const tokenResponseSchema = z.object({ access_token: z.string().min(1), expires_in: z.coerce.number().positive(), token_type: z.string() });
export const emptyResultSchema = z.object({ detail: z.literal("No results found.") });

export const listSchema = <T extends z.ZodType>(item: T) => z.array(item);

export type OpenF1Session = z.infer<typeof sessionSchema>;
export type OpenF1Driver = z.infer<typeof driverSchema>;
export type OpenF1Position = z.infer<typeof positionSchema>;
export type OpenF1Interval = z.infer<typeof intervalSchema>;
export type OpenF1RaceControl = z.infer<typeof raceControlSchema>;
export type OpenF1Lap = z.infer<typeof lapSchema>;
export type OpenF1Stint = z.infer<typeof stintSchema>;
