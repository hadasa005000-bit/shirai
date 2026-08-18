import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function userId() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
}

export async function GET() {
  const uid = await userId();
  if (!uid) return NextResponse.json({ favorites: [] });
  const favorites = await db.favorite.findMany({
    where: { userId: uid },
    select: { songId: true },
  });
  return NextResponse.json({ favorites: favorites.map((f) => f.songId) });
}

export async function POST(req: NextRequest) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { songId } = await req.json();
  if (!songId) return NextResponse.json({ error: "missing songId" }, { status: 400 });

  const existing = await db.favorite.findUnique({
    where: { userId_songId: { userId: uid, songId } },
  });
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorite: false });
  }
  await db.favorite.create({ data: { userId: uid, songId } });
  return NextResponse.json({ favorite: true });
}
