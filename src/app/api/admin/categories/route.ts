import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import slugify from "slugify";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const category = await db.category.create({
    data: {
      name: body.name,
      slug: slugify(body.name, { lower: true, strict: true }) + "-" + Date.now().toString(36),
    },
  });
  return NextResponse.json({ category });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  await db.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
