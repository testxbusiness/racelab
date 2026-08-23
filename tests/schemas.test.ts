import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyResultSchema, intervalSchema, lapSchema, positionSchema, raceControlSchema, stintSchema } from "@/lib/openf1/schemas";
import { getRateBudgetSnapshot, openF1Fetch, recordOpenF1ProviderResult, recordOpenF1ValidationFailure, resetTokenForTests } from "@/lib/openf1/live-client";

describe("OpenF1 Phase 1 schemas", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); resetTokenForTests(); });
  it("accepts position and nullable interval fields", () => {
    expect(positionSchema.parse({ date: "2026-08-23T12:00:00+00:00", driver_number: 1, position: 2, session_key: 1 }).position).toBe(2);
    expect(intervalSchema.parse({ date: "2026-08-23T12:00:00+00:00", driver_number: 1, session_key: 1, interval: null, gap_to_leader: null }).interval).toBeNull();
  });
  it("rejects malformed race control timestamps", () => {
    expect(raceControlSchema.safeParse({ date: "not-a-date", session_key: 1, category: "Flag" }).success).toBe(false);
  });
  it("recognizes OpenF1's valid empty-result response", () => {
    expect(emptyResultSchema.safeParse({ detail: "No results found." }).success).toBe(true);
  });
  it("validates lap data used by the diagnostic summary", () => {
    expect(lapSchema.parse({ date_start: null, date_end: null, session_key: 1, driver_number: 1, lap_number: 7 }).lap_number).toBe(7);
  });
  it("validates stints used by the live composer", () => {
    expect(stintSchema.parse({ compound: "MEDIUM", driver_number: 16, lap_end: 20, lap_start: 5, meeting_key: 2, session_key: 1, stint_number: 2, tyre_age_at_start: 3 }).compound).toBe("MEDIUM");
  });

  it("authenticates server-side once and reuses the bearer token", async () => {
    vi.stubEnv("OPENF1_USERNAME", "test-user");
    vi.stubEnv("OPENF1_PASSWORD", "test-password");
    vi.stubEnv("OPENF1_API_URL", "https://api.example.test/v1");
    vi.stubEnv("OPENF1_TOKEN_URL", "https://api.example.test/token");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "secret-token", expires_in: 3600, token_type: "bearer" }), { status: 200 })).mockResolvedValue(new Response("[]", { status: 200 }));
    await openF1Fetch("position?session_key=1");
    await openF1Fetch("intervals?session_key=1");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ headers: expect.any(Headers) });
    const headers = fetchMock.mock.calls[1]?.[1]?.headers;
    expect(new Headers(headers).get("authorization")).toBe("Bearer secret-token");
    expect(getRateBudgetSnapshot(2).warning).toBe("near_limit");
  });

  it("captures provider record counts and validation failures without logging payloads", () => {
    recordOpenF1ProviderResult("position?session_key=1", 20, "2026-08-23T12:00:00+00:00");
    recordOpenF1ValidationFailure("position?session_key=1", 2);
    expect(getRateBudgetSnapshot().endpoints.position).toMatchObject({ lastRecordCount: 20, lastSourceTimestamp: "2026-08-23T12:00:00+00:00", validationFailures: 1 });
  });
});
