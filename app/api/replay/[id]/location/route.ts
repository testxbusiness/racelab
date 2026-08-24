import { NextResponse } from "next/server";
import { mapLocation } from "@/lib/openf1/mappers";
import { loadReplayFixture } from "@/lib/replay/load-fixture";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const { id } = await context.params;
    const fixture = await loadReplayFixture(id);
    const params = new URL(request.url).searchParams;
    const elapsedMs = Number(params.get("elapsedMs") ?? 0);
    const after = params.get("after");
    const cutoff = Date.parse(fixture.manifest.sessionStart) + (Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0);
    const samples = fixture.location.filter((sample) => Date.parse(sample.date) <= cutoff && (!after || sample.date > after)).map(mapLocation);
    return NextResponse.json({ ok: true, snapshot: { samples, sourceTimestamp: samples.map((sample) => sample.sourceTimestamp).sort().at(-1) ?? null, receivedAt: new Date().toISOString() } });
  } catch {
    return NextResponse.json({ ok: false, error: "Replay location unavailable" }, { status: 404 });
  }
}
