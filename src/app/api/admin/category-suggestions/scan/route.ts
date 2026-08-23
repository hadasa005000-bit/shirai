import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { suggestNewCategory } from "@/lib/classify";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // סורקים רק שירים ללא קטגוריה — אלה שהבוט לא הצליח לשייך בזמן ההוספה
  const songs = await db.song.findMany({
    where: { categoryId: null },
    select: { title: true, description: true },
  });

  let scanned = 0;
  let suggested = 0;

  for (const song of songs) {
    scanned += 1;
    const text = `${song.title} ${song.description ?? ""}`;
    const candidate = suggestNewCategory(text);
    if (!candidate) continue;

    const existing = await db.categorySuggestion.findUnique({ where: { name: candidate.name } });
    if (!existing) {
      await db.categorySuggestion.create({
        data: { name: candidate.name, keyword: candidate.keyword, matchCount: 1 },
      });
      suggested += 1;
    } else if (existing.status === "PENDING") {
      await db.categorySuggestion.update({
        where: { id: existing.id },
        data: { matchCount: { increment: 1 } },
      });
    }
    // REJECTED — מכבדים את ההחלטה הקודמת, לא נוגעים
  }

  return NextResponse.json({ ok: true, scanned, suggested });
}
