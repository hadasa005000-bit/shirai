import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { backfillSourcesFromApprovedSongs } from "@/lib/bot";

/**
 * סריקה ידנית (כפתור בדשבורד) של כל השירים המאושרים הקיימים באתר —
 * לאמנים שכבר יש להם כמה שירים מאושרים אבל אף פעם לא קיבלו מקור קבוע
 * (למשל כי אושרו לפני שהמנגנון הזה נוסף). לא יוצר כפילויות.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await backfillSourcesFromApprovedSongs();
  return NextResponse.json({ ok: true, ...result });
}
