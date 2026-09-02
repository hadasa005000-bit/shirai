import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * ספירת הודעות לא-נקראו מהמנהל, בלי לסמן אותן כנקראו (בניגוד ל-GET
 * /api/chat/messages) — כדי שאפשר יהיה להראות "יש הודעה ממתינה" (סימן
 * על כפתור הצ'אט הסגור) בלי לאפס את זה רק כי בדקנו.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ count: 0 });
  const userId = (session.user as any).id;

  const count = await db.chatMessage.count({
    where: { userId, senderRole: "admin", readByUser: false },
  });

  return NextResponse.json({ count });
}
