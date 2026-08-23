import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkScriptAuth } from "@/lib/script-auth";

export async function POST(req: NextRequest) {
  if (!checkScriptAuth(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const { runId, songId, title, youtubeId, verdict, dryRun } = body;

  if (!runId || !songId || !verdict) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // *** ליבת ההגנה — לא הסקריפט קובע, השרת קובע ***
  // רק "allowed" בדיוק, ולא dryRun, מוביל לאישור בפועל. כל דבר אחר —
  // כולל שגיאה, timeout, תשובה לא ברורה, או ערך לא צפוי — נשאר בהמתנה.
  const shouldApprove = verdict === "allowed" && !dryRun;

  if (shouldApprove) {
    await db.song.update({ where: { id: songId }, data: { status: "PUBLISHED" } });
  }

  await db.scriptDecision.create({
    data: {
      runId,
      songId,
      title: title ?? "",
      youtubeId: youtubeId ?? null,
      verdict: verdict === "allowed" ? "allowed" : "blocked_or_error",
      action: dryRun ? "dry_run" : shouldApprove ? "approved" : "left_pending",
    },
  });

  return NextResponse.json({ ok: true, approved: shouldApprove });
}
