import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * פירוט כל הביקורים ביום ספציפי — שעה, IP, ואם מדובר במשתמש רשום, שמו
 * ואימייל שלו. עבור מבקר אנונימי אין דרך לדעת מיהו בפועל - IP מגלה
 * לכל היותר עיר/מדינה וספק אינטרנט כלליים, לא זהות אישית.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date, expected YYYY-MM-DD" }, { status: 400 });
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const visits = await db.siteVisit.findMany({
    where: { createdAt: { gte: dayStart, lt: dayEnd } },
    orderBy: { createdAt: "asc" },
  });

  const userIds = Array.from(new Set(visits.map((v) => v.userId).filter(Boolean))) as string[];
  const users = userIds.length
    ? await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const result = visits.map((v) => ({
    id: v.id,
    time: v.createdAt,
    ip: v.ip,
    registered: v.userId ? userMap.get(v.userId) ?? null : null,
  }));

  return NextResponse.json({ date, count: result.length, visits: result });
}
