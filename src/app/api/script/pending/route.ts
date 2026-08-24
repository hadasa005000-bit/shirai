import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkScriptAuth } from "@/lib/script-auth";

export async function GET(req: NextRequest) {
  if (!checkScriptAuth(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 200);

  // "כבר נבדק" נחשב רק אם הייתה על השיר הזה החלטה אמיתית (לא בדיקת --dry-run) —
  // כך שבדיקת ניסיון לא "תופסת מקום" של בדיקה אמיתית לאותם שירים.
  const alreadyChecked = await db.scriptDecision.findMany({
    where: { action: { not: "dry_run" } },
    select: { songId: true },
  });
  const checkedIds = alreadyChecked.map((d) => d.songId);

  const songs = await db.song.findMany({
    where: {
      status: "PENDING",
      youtubeId: { not: null },
      id: { notIn: checkedIds },
    },
    // רק מזהים טכניים — בלי כותרות/טקסט חופשי, כדי שנטפרי לא תסרוק
    // ותחסום את התשובה עצמה בגלל תוכן לא-מסונן בכותרת שיר כלשהי
    select: { id: true, youtubeId: true },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ songs });
}
