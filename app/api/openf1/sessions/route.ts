import { NextResponse } from "next/server";
import { mapSession } from "@/lib/openf1/mappers";
import { openF1Provider } from "@/lib/openf1/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessions = (await openF1Provider.getSessions()).map(mapSession);
    return NextResponse.json({ ok: true, sessions }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ ok: false, sessions: [] }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
