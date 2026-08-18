import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runBot } from "@/lib/bot";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const result = await runBot();
  return NextResponse.json(result);
}
