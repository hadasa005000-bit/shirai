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
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const suggestions = await db.categorySuggestion.findMany({
    where: { status: "PENDING" },
    orderBy: { matchCount: "desc" },
  });
  return NextResponse.json({ suggestions });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const { id, action } = body; // action: "approve" | "reject"

  const suggestion = await db.categorySuggestion.findUnique({ where: { id } });
  if (!suggestion) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (action === "reject") {
    await db.categorySuggestion.update({ where: { id }, data: { status: "REJECTED" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "approve") {
    // יוצרים את הקטגוריה בפועל
    const slug = slugify(suggestion.name, { lower: true, strict: true }) + "-" + Date.now().toString(36);
    const category = await db.category.create({ data: { name: suggestion.name, slug } });

    await db.categorySuggestion.update({
      where: { id },
      data: { status: "APPROVED", categoryId: category.id },
    });

    // משייכים בדיעבד שירים קיימים (ללא קטגוריה) שמתאימים למילת המפתח
    await db.song.updateMany({
      where: {
        categoryId: null,
        OR: [
          { title: { contains: suggestion.keyword, mode: "insensitive" } },
          { description: { contains: suggestion.keyword, mode: "insensitive" } },
        ],
      },
      data: { categoryId: category.id },
    });

    return NextResponse.json({ ok: true, category });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
