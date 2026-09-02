import { NextRequest, NextResponse } from "next/server";
import { markOnline, countOnline, wasVisitLoggedToday, markVisitLoggedToday } from "@/lib/redis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/** Render (וכל שרת מאחורי proxy) שם את ה-IP האמיתי בכותרת הזו. */
function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sessionId = body?.sessionId;
  if (!sessionId) return NextResponse.json({ error: "missing sessionId" }, { status: 400 });
  await markOnline(sessionId);

  // רישום ביקור יומי — פעם אחת בלבד ליום לכל sessionId, גם משתמשים
  // אנונימיים (לא רשומים). לא רושמים בכל פעימת heartbeat (כל 20 שניות),
  // רק בפעם הראשונה היום לכל מבקר, כדי שהספירה תשקף כניסות אמיתיות.
  const alreadyLoggedToday = await wasVisitLoggedToday(sessionId);
  if (!alreadyLoggedToday) {
    const session = await getServerSession(authOptions).catch(() => null);
    const userId = (session?.user as any)?.id ?? null;
    const ip = getClientIp(req);
    await db.siteVisit.create({ data: { sessionId, userId, ip } }).catch(() => {});
    await markVisitLoggedToday(sessionId);
  }

  const count = await countOnline();
  return NextResponse.json({ ok: true, count });
}

export async function GET() {
  const count = await countOnline();
  return NextResponse.json({ count });
}
