import { NextResponse } from "next/server";
import { getOpenF1Env } from "@/lib/openf1/env";
import { getDiagnostics } from "@/lib/openf1/diagnostics";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!getOpenF1Env().OPENF1_DIAGNOSTICS_ENABLED) return NextResponse.json({ error: "Diagnostics disabled" }, { status: 404 });
  const result = await getDiagnostics();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
