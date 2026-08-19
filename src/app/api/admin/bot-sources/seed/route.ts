import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * רשימת חיפושים מובנית שמכסה את עולם המוזיקה החסידית/חרדית ברוחב —
 * כך הבוט לא צריך שתוסיפו ערוץ אחרי ערוץ ידנית. אפשר להוסיף/להסיר
 * שורות בהמשך מתוך דף "בוט חיפוש שירים" כמו כל מקור רגיל.
 */
const DEFAULT_QUERIES = [
  "שיר חדש חסידי 2026",
  "מוזיקה חסידית חדש 2026",
  "ניגוני שבת חדש",
  "שירי חתונה חסידיים",
  "מקהלת ילדים חסידית",
  "אקפלה חסידי 2026",
  "שיר התעוררות חדש",
  "מוזיקה יהודית חדש",
  "שירי פורים חסידי",
  "שירי פסח חסידי",
  "ריקודי שמחה חסידי",
  "ניגון חדש חסידי",
  "זמר חסידי שיר חדש",
  "מוזיקה חרדית 2026",
  "שיר חדש דתי לאומי",
];

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let created = 0;
  for (const query of DEFAULT_QUERIES) {
    const existing = await db.botSource.findFirst({
      where: { type: "youtube_search", value: query },
    });
    if (existing) continue;
    await db.botSource.create({
      data: {
        label: `חיפוש — ${query}`,
        type: "youtube_search",
        value: query,
      },
    });
    created += 1;
  }

  return NextResponse.json({ ok: true, created });
}
