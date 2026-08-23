import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkScriptAuth } from "@/lib/script-auth";

export async function POST(req: NextRequest) {
  if (!checkScriptAuth(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const run = await db.scriptRun.update({
    where: { id: body.runId },
    data: {
      finishedAt: new Date(),
      checked: body.checked ?? 0,
      approved: body.approved ?? 0,
      skipped: body.skipped ?? 0,
    },
  });
  return NextResponse.json({ ok: true, run });
}
