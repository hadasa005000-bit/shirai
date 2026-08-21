import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import slugify from "slugify";

async function resolveArtistId(artistId?: string | null, artistName?: string | null) {
  if (artistId) return artistId;
  if (!artistName || !artistName.trim()) return undefined;
  const name = artistName.trim();
  const existing = await db.artist.findUnique({ where: { name } });
  if (existing) return existing.id;
  const created = await db.artist.create({
    data: { name, slug: slugify(name, { lower: true, strict: true }) + "-" + Date.now().toString(36) },
  });
  return created.id;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const status = req.nextUrl.searchParams.get("status") as any;
  const songs = await db.song.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { artist: true, category: true },
  });
  return NextResponse.json({ songs });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const artistId = await resolveArtistId(body.artistId, body.artistName);
  const song = await db.song.create({
    data: {
      title: body.title,
      artistId: artistId ?? null,
      categoryId: body.categoryId || null,
      youtubeId: body.youtubeId || null,
      driveLink: body.driveLink || null,
      lyrics: body.lyrics || null,
      status: body.status || "PUBLISHED",
      source: "manual",
    },
  });
  return NextResponse.json({ song });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  // תמיכה בעדכון זמר לפי שם (יוצר אם לא קיים) — משמש את מסך "ארגון" בדשבורד
  const artistId =
    body.artistName !== undefined
      ? await resolveArtistId(undefined, body.artistName)
      : body.artistId;

  const song = await db.song.update({
    where: { id: body.id },
    data: {
      title: body.title,
      artistId,
      categoryId: body.categoryId,
      youtubeId: body.youtubeId,
      driveLink: body.driveLink,
      lyrics: body.lyrics,
      status: body.status,
    },
  });
  return NextResponse.json({ song });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  await db.song.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
