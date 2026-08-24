import { describe, expect, it } from "vitest";
import { featuredSession, scheduledSessionState } from "@/lib/f1/domain/event-schedule";
import type { LiveSession } from "@/lib/f1/domain/live";

const session = (name: string, start: string, end: string | null): LiveSession => ({ key: name.length, meetingKey: 1, name, type: name, countryName: "Italy", circuitName: "Monza", dateStart: start, dateEnd: end });

describe("event schedule", () => {
  it("classifies upcoming, live, and ended sessions by dates", () => {
    const now = Date.parse("2026-09-04T12:00:00Z");
    expect(scheduledSessionState(session("Practice", "2026-09-04T10:00:00Z", "2026-09-04T11:00:00Z"), now)).toBe("ended");
    expect(scheduledSessionState(session("Qualifying", "2026-09-04T12:00:00Z", "2026-09-04T13:00:00Z"), now)).toBe("live");
    expect(scheduledSessionState(session("Race", "2026-09-06T12:00:00Z", "2026-09-06T14:00:00Z"), now)).toBe("upcoming");
  });

  it("prefers the live session, then the next upcoming session", () => {
    const now = Date.parse("2026-09-04T12:00:00Z");
    const sessions = [session("Race", "2026-09-06T12:00:00Z", "2026-09-06T14:00:00Z"), session("Qualifying", "2026-09-04T12:00:00Z", "2026-09-04T13:00:00Z")];
    expect(featuredSession(sessions, now)?.name).toBe("Qualifying");
    expect(featuredSession(sessions, Date.parse("2026-09-04T13:30:00Z"))?.name).toBe("Race");
  });
});
