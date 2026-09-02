import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "missing userId" }, { status: 400 });

  const messages = await db.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  // סימון הודעות המשתמש כ"נקראו" ברגע שהמנהל פותח את השיחה הזו
  await db.chatMessage.updateMany({
    where: { userId, senderRole: "user", readByAdmin: false },
    data: { readByAdmin: true },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const userId = body?.userId;
  const text = (body?.text ?? "").toString().trim().slice(0, 2000);
  if (!userId || !text) return NextResponse.json({ error: "missing userId or text" }, { status: 400 });

  const message = await db.chatMessage.create({
    data: { userId, senderRole: "admin", text, readByAdmin: true },
  });

  return NextResponse.json({ message });
}
