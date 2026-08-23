import { NextResponse } from "next/server";
import { z } from "zod";
import { getLocationSnapshot } from "@/lib/openf1/location-service";

const querySchema = z.object({ session_key: z.coerce.number().int().positive(), after: z.string().datetime({ offset: true }).nullable() });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ session_key: url.searchParams.get("session_key"), after: url.searchParams.get("after") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid location cursor" }, { status: 400 });
  try { return NextResponse.json({ ok: true, snapshot: await getLocationSnapshot(parsed.data.session_key, parsed.data.after) }); }
  catch { return NextResponse.json({ ok: false, error: "Location provider unavailable" }, { status: 503 }); }
}
