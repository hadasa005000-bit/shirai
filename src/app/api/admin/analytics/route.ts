import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * סטטיסטיקת ביקורים לדשבורד — כמה כניסות היו היום / השבוע / החודש,
 * כולל מבקרים לא-רשומים (כל sessionId נספר), ופירוט יומי ל-30 הימים
 * האחרונים להצגה כרשימה/גרף פשוט.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6); // 7 ימים כולל היום
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 29); // 30 יום כולל היום

  const [today, week, month, registeredMonth, allVisits] = await Promise.all([
    db.siteVisit.count({ where: { createdAt: { gte: todayStart } } }),
    db.siteVisit.count({ where: { createdAt: { gte: weekStart } } }),
    db.siteVisit.count({ where: { createdAt: { gte: monthStart } } }),
    db.siteVisit.count({ where: { createdAt: { gte: monthStart }, userId: { not: null } } }),
    db.siteVisit.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { createdAt: true },
    }),
  ]);

  // פירוט יומי — 30 הימים האחרונים, גם ימים עם 0 ביקורים
  const daily: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    daily.push({ date: dateStr, count: 0 });
  }
  const dailyIndex = new Map(daily.map((d, i) => [d.date, i]));
  for (const v of allVisits) {
    const dateStr = v.createdAt.toISOString().slice(0, 10);
    const idx = dailyIndex.get(dateStr);
    if (idx !== undefined) daily[idx].count += 1;
  }

  return NextResponse.json({
    today,
    week,
    month,
    registeredMonth,
    anonymousMonth: month - registeredMonth,
    daily,
  });
}
