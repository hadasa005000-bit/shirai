import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkScriptAuth } from "@/lib/script-auth";

export async function POST(req: NextRequest) {
  if (!checkScriptAuth(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const { runId, songId, verdict, dryRun } = body;

  if (!runId || !songId || !verdict) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // השרת שולף את הכותרת בעצמו מהמסד — לא סומך על טקסט שהסקריפט שולח,
  // וכך גם לא שולחים כותרות שירים בחזרה על פני הרשת (נטפרי לא סורקת את זה)
  const song = await db.song.findUnique({ where: { id: songId }, select: { title: true, youtubeId: true } });

  // *** ליבת ההגנה — לא הסקריפט קובע, השרת קובע ***
  // רק "allowed" בדיוק, ולא dryRun, מוביל לאישור בפועל.
  const shouldApprove = verdict === "allowed" && !dryRun;

  if (shouldApprove) {
    await db.song.update({
      where: { id: songId },
      data: { status: "PUBLISHED", scriptHidden: false },
    });
  } else if (!dryRun) {
    // לא פתוח (או שגיאה) — יוצא מרשימת "ממתין לאישור" אל "מוסתר", כדי
    // שההמתנה תישאר קטנה ותציג רק דברים שבאמת עוד לא נבדקו. לא נמחק —
    // אפשר עדיין למצוא ולפרסם ידנית תחת הסינון "מוסתר". מסומן scriptHidden
    // כדי שריצות עתידיות של הסקריפט עדיין יבדקו אותו שוב (בניגוד להסתרה
    // ידנית ע"י מנהל, שהסקריפט לא נוגע בה).
    await db.song.update({
      where: { id: songId },
      data: { status: "HIDDEN", scriptHidden: true },
    });
  }

  await db.scriptDecision.create({
    data: {
      runId,
      songId,
      title: song?.title ?? "",
      youtubeId: song?.youtubeId ?? null,
      verdict: verdict === "allowed" ? "allowed" : "blocked_or_error",
      action: dryRun ? "dry_run" : shouldApprove ? "approved" : "left_pending",
    },
  });

  return NextResponse.json({ ok: true, approved: shouldApprove });
}
