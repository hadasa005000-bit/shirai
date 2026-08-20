import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * שני סוגי חיפושים מובנים:
 * 1. נושאים כלליים — מכסים תוכן חדש בכל הקטגוריות בלי תלות בזמר ספציפי.
 * 2. שמות זמרים/מקהלות חסידיים וחרדיים מוכרים — כדי שהבוט יתחיל למצוא
 *    תוכן ישירות משמות מוכרים, ולא רק ממה שמזדמן לו בחיפוש כללי.
 *
 * הערה: הרשימה הזו היא נקודת פתיחה בלבד ולא רשימה סגורה/מאושרת דתית —
 * היא כאן כדי לתת לבוט "לאן להתחיל לחפש", לא כדי להחליט מה מתאים.
 * כל שיר עדיין עובר אצלכם ל-✓/✗ לפני שהוא עולה לאתר. אפשר להוסיף/למחוק
 * שמות בהמשך מתוך דף "בוט חיפוש שירים" כמו כל מקור רגיל.
 */
const TOPIC_QUERIES = [
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

const ARTIST_QUERIES = [
  "מרדכי בן דוד שיר חדש",
  "אברהם פריד שיר חדש",
  "יעקב שוואקי שיר חדש",
  "ישי לפידות שיר חדש",
  "בני פרידמן שיר חדש",
  "מוטי שטיינמץ שיר חדש",
  "שלמה יידוב שיר חדש",
  "יונתן רזאל שיר חדש",
  "אהרן רזאל שיר חדש",
  "איתי לוי אקפלה",
  "נתנאל לייפר שיר חדש",
  "מקהלת נגינה שיר חדש",
  "מקהלת מלכות שיר חדש",
  "מקהלת פרחי שיר חדש",
  "יואלי דיקמן שיר חדש",
  "עומר אדם שיר חדש דתי",
  "גד אלבז שיר חדש",
  "ליפא שמעלצער שיר חדש",
];

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let created = 0;
  const all = [...TOPIC_QUERIES, ...ARTIST_QUERIES];

  for (const query of all) {
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
