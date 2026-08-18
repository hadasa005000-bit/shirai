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
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [sources, logs] = await Promise.all([
    db.botSource.findMany({ orderBy: { createdAt: "desc" } }),
    db.botRunLog.findMany({ orderBy: { startedAt: "desc" }, take: 15 }),
  ]);
  return NextResponse.json({ sources, logs });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const label = String(body?.label ?? "").trim();
  const type = body?.type === "youtube_search" ? "youtube_search" : "youtube_channel";
  const value = String(body?.value ?? "").trim();
  const defaultCategoryId = body?.defaultCategoryId ? String(body.defaultCategoryId) : null;

  if (!label || !value)
    return NextResponse.json({ error: "חסר שם או ערך למקור" }, { status: 400 });

  const source = await db.botSource.create({
    data: { label, type, value, defaultCategoryId },
  });
  return NextResponse.json({ source });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "חסר מזהה" }, { status: 400 });

  const source = await db.botSource.update({
    where: { id },
    data: { active: Boolean(body?.active) },
  });
  return NextResponse.json({ source });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "חסר מזהה" }, { status: 400 });

  await db.botSource.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
