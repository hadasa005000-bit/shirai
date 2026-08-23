import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkScriptAuth } from "@/lib/script-auth";

export async function POST(req: NextRequest) {
  if (!checkScriptAuth(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const run = await db.scriptRun.create({ data: { dryRun: !!body.dryRun } });
  return NextResponse.json({ runId: run.id });
}
