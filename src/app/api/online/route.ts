import { NextRequest, NextResponse } from "next/server";
import { markOnline, countOnline } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sessionId = body?.sessionId;
  if (!sessionId) return NextResponse.json({ error: "missing sessionId" }, { status: 400 });
  await markOnline(sessionId);
  const count = await countOnline();
  return NextResponse.json({ ok: true, count });
}

export async function GET() {
  const count = await countOnline();
  return NextResponse.json({ count });
}
