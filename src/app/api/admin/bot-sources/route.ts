import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const sources = await db.botSource.findMany({ orderBy: { createdAt: "desc" } });
  const logs = await db.botRunLog.findMany({ orderBy: { startedAt: "desc" }, take: 10 });
  return NextResponse.json({ sources, logs });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const source = await db.botSource.create({
    data: {
      label: body.label,
      type: body.type,
      value: body.value,
      defaultCategoryId: body.defaultCategoryId || null,
    },
  });
  return NextResponse.json({ source });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  await db.botSource.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
