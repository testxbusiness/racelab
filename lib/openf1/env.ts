import "server-only";
import { z } from "zod";

const envSchema = z.object({
  OPENF1_USERNAME: z.string().min(1).optional(),
  OPENF1_PASSWORD: z.string().min(1).optional(),
  OPENF1_API_URL: z.string().url().default("https://api.openf1.org/v1"),
  OPENF1_TOKEN_URL: z.string().url().default("https://api.openf1.org/token"),
  OPENF1_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(60),
  OPENF1_DIAGNOSTICS_ENABLED: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
});

export function getOpenF1Env() {
  return envSchema.parse(process.env);
}
