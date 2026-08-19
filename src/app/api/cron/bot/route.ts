import { NextRequest, NextResponse } from "next/server";
import { runBot } from "@/lib/bot";

/**
 * הרצת הבוט מבחוץ (Render Cron / cron-job.org / pg_cron).
 * קריאה: GET /api/cron/bot?key=CRON_SECRET
 * הכתובת מוגנת בסוד כדי שלא כל אחד יוכל להפעיל סריקה.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // CRON_SECRET הוא המפתח המועדף; אם לא הוגדר מקבלים גם את SETUP_SECRET,
  // כדי שאפשר יהיה להפעיל את הבוט מיד אחרי ההתקנה.
  const expected = process.env.CRON_SECRET || process.env.SETUP_SECRET;
  if (!expected)
    return NextResponse.json(
      { error: "CRON_SECRET (או SETUP_SECRET) לא מוגדר במשתני הסביבה" },
      { status: 400 }
    );

  const key =
    req.nextUrl.searchParams.get("key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (key !== expected) return NextResponse.json({ error: "מפתח שגוי" }, { status: 403 });

  const result = await runBot();
  return NextResponse.json({ ok: true, ...result });
}
