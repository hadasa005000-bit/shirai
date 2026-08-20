import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const settings = await db.appSettings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json({
    botAutoPublish: settings?.botAutoPublish ?? false,
  });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  const settings = await db.appSettings.upsert({
    where: { id: "singleton" },
    update: { botAutoPublish: !!body.botAutoPublish },
    create: { id: "singleton", botAutoPublish: !!body.botAutoPublish },
  });
  return NextResponse.json({ botAutoPublish: settings.botAutoPublish });
}
