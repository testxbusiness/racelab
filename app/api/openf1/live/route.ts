import { NextResponse } from "next/server";
import { getOpenF1Env } from "@/lib/openf1/env";
import { getLiveRaceState } from "@/lib/openf1/live-state-service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!getOpenF1Env().OPENF1_DIAGNOSTICS_ENABLED) return NextResponse.json({ error: "Live timing unavailable" }, { status: 503 });
  try { return NextResponse.json({ ok: true, state: await getLiveRaceState() }); } catch { return NextResponse.json({ ok: false, error: "Live provider unavailable" }, { status: 503 }); }
}
