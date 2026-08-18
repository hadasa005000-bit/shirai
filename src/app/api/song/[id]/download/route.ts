import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** סופר הורדות ומפנה לקישור ההורדה של השיר. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const song = await db.song.findUnique({ where: { id: params.id } });
  if (!song || !song.driveLink || song.status === "HIDDEN") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await db.song
    .update({ where: { id: song.id }, data: { downloads: { increment: 1 } } })
    .catch(() => {});
  return NextResponse.redirect(song.driveLink, 302);
}
