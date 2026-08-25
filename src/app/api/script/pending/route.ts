import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkScriptAuth } from "@/lib/script-auth";

export async function GET(req: NextRequest) {
  if (!checkScriptAuth(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 200);
  const runId = req.nextUrl.searchParams.get("runId");

  // מחריגים רק שירים שכבר נבדקו בתוך *הריצה הנוכחית* (כדי לא ליפול
  // בלולאה אינסופית על אותו שיר בתוך ריצה אחת). ריצה חדשה (מחר, למשל)
  // מתחילה מאפס ובודקת הכל שוב — שום שיר לא נפסל לצמיתות מעצם ריצה קודמת.
  let excludeIds: string[] = [];
  if (runId) {
    const decidedThisRun = await db.scriptDecision.findMany({
      where: { runId },
      select: { songId: true },
    });
    excludeIds = decidedThisRun.map((d) => d.songId);
  }

  const songs = await db.song.findMany({
    where: {
      youtubeId: { not: null },
      // "ממתין" רגיל, או "מוסתר ע"י הסקריפט" (לא ע"י מנהל ידנית) —
      // כדי לתת לו הזדמנות נוספת בכל ריצה חדשה
      OR: [{ status: "PENDING" }, { status: "HIDDEN", scriptHidden: true }],
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    select: { id: true, youtubeId: true },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ songs });
}
