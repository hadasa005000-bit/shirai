import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * מחזיר את ריצות הבוט האחרונות כולל כל שורות היומן המפורטות שלהן
 * (מה נסרק, מה נוסף, מה דולג, אילו מקורות חדשים נוצרו, שגיאות),
 * ובנפרד — אירועי "למידה" שקרו מחוץ לריצה מתוזמנת (למשל אישור ידני
 * של שיר שגרם ליצירת מקור חדש).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const runs = await db.botRunLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
    include: {
      entries: { orderBy: { createdAt: "asc" } },
    },
  });

  const systemEvents = await db.botLogEntry.findMany({
    where: { runId: null },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ runs, systemEvents });
}
