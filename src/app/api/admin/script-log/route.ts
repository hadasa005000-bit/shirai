import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const runId = req.nextUrl.searchParams.get("runId");

  if (runId) {
    const decisions = await db.scriptDecision.findMany({
      where: { runId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ decisions });
  }

  const runs = await db.scriptRun.findMany({ orderBy: { startedAt: "desc" }, take: 30 });
  return NextResponse.json({ runs });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  // ביטול החלטה בודדת: מחזיר את השיר ל"ממתין לאישור"
  const decision = await db.scriptDecision.findUnique({ where: { id: body.decisionId } });
  if (!decision) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (decision.action === "approved") {
    await db.song.update({ where: { id: decision.songId }, data: { status: "PENDING" } });
  }
  await db.scriptDecision.update({ where: { id: decision.id }, data: { reverted: true } });

  return NextResponse.json({ ok: true });
}
