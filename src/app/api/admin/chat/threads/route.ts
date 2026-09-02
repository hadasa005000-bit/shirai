import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * רשימת כל השיחות (משתמש = שיחה אחת), עם תצוגה מקדימה של ההודעה
 * האחרונה וכמה הודעות לא-נקראו יש מהמשתמש. ממוין לפי הודעה אחרונה.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const users = await db.user.findMany({
    where: { chatMessages: { some: {} } },
    select: {
      id: true,
      name: true,
      email: true,
      chatMessages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: { chatMessages: { where: { senderRole: "user", readByAdmin: false } } },
      },
    },
  });

  const threads = users
    .map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      lastMessage: u.chatMessages[0]?.text ?? "",
      lastMessageAt: u.chatMessages[0]?.createdAt ?? null,
      unread: u._count.chatMessages,
    }))
    .sort((a, b) => (b.lastMessageAt && a.lastMessageAt ? +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt) : 0));

  return NextResponse.json({ threads });
}
