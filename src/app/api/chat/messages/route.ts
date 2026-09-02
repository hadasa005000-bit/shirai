import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/** משתמש רשום מקבל רק את השיחה הפרטית שלו מול המנהל — אף פעם לא של אחרים. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const messages = await db.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  // סימון הודעות המנהל כ"נקראו" ברגע שהמשתמש פותח/מרענן את הצ'אט שלו
  await db.chatMessage.updateMany({
    where: { userId, senderRole: "admin", readByUser: false },
    data: { readByUser: true },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const body = await req.json().catch(() => null);
  const text = (body?.text ?? "").toString().trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: "empty message" }, { status: 400 });

  const message = await db.chatMessage.create({
    data: { userId, senderRole: "user", text },
  });

  return NextResponse.json({ message });
}
