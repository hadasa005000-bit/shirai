import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkScriptAuth } from "@/lib/script-auth";

export async function GET(req: NextRequest) {
  if (!checkScriptAuth(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 200);

  // כבר נבדקו בעבר (בכל הרצה, גם ישנה) — לא בודקים אותם שוב
  const alreadyChecked = await db.scriptDecision.findMany({ select: { songId: true } });
  const checkedIds = alreadyChecked.map((d) => d.songId);

  const songs = await db.song.findMany({
    where: {
      status: "PENDING",
      youtubeId: { not: null },
      id: { notIn: checkedIds },
    },
    select: { id: true, title: true, youtubeId: true },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ songs });
}
