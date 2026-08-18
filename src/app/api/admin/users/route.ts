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
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json();
  if (!body.id || !body.role) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  if (body.id === (session.user as any).id) {
    return NextResponse.json({ error: "אי אפשר לשנות את התפקיד של עצמך" }, { status: 400 });
  }
  const user = await db.user.update({ where: { id: body.id }, data: { role: body.role } });
  return NextResponse.json({ user });
}
