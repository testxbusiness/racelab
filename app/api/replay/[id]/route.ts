import { NextResponse } from "next/server";
import { loadReplayFixture } from "@/lib/replay/load-fixture";
import { replayStateAt } from "@/lib/replay/fixture";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Not found" }, { status: 404 });
  try { const { id } = await context.params; const fixture = await loadReplayFixture(id); const elapsed = Number(new URL(request.url).searchParams.get("elapsedMs") ?? 0); const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0; const virtualNow = Date.parse(fixture.manifest.sessionStart) + safeElapsed; return NextResponse.json({ ok: true, state: replayStateAt(fixture, safeElapsed, virtualNow) }); }
  catch { return NextResponse.json({ ok: false, error: "Replay fixture unavailable" }, { status: 404 }); }
}
