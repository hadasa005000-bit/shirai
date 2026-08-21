import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const artists = await db.artist.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json({ artists });
}
