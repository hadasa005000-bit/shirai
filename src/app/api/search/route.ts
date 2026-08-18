import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  const results = await db.song.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { artist: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: { artist: true, category: true },
    take: 30,
  });

  return NextResponse.json({ results });
}
