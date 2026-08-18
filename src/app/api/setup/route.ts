import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * One-time bootstrap route for hosts without shell access (e.g. Render free tier).
 * Visit /api/setup?key=YOUR_SETUP_SECRET once after first deploy to:
 *  - create the default categories
 *  - create the first admin user
 *
 * Protected by SETUP_SECRET so random visitors can't trigger it.
 * After you've run it once, remove SETUP_SECRET from your environment
 * variables (or just leave it — the route refuses to run twice, since it
 * checks whether an admin already exists).
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const expected = process.env.SETUP_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "SETUP_SECRET לא מוגדר במשתני הסביבה — הוסיפו אותו קודם." },
      { status: 400 }
    );
  }
  if (key !== expected) {
    return NextResponse.json({ error: "מפתח שגוי" }, { status: 403 });
  }

  const existingAdmin = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) {
    return NextResponse.json({
      ok: true,
      message: "כבר קיים מנהל במערכת — לא נוצר משתמש נוסף.",
    });
  }

  const categories = [
    { name: "ניגוני שבת", slug: "shabbat" },
    { name: "שמחה וריקודים", slug: "simcha" },
    { name: "התעוררות", slug: "hitorerut" },
    { name: "חתונה", slug: "wedding" },
    { name: "בין הזמנים", slug: "bein-hazmanim" },
    { name: "ילדים", slug: "kids" },
    { name: "אקפלה", slug: "acapella" },
  ];
  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "[email protected]";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await db.user.create({
    data: { name: "מנהל האתר", email: adminEmail, passwordHash, role: "ADMIN" },
  });

  return NextResponse.json({
    ok: true,
    message: `נוצר משתמש מנהל: ${adminEmail}. היכנסו עם הסיסמה שהגדרתם ב-SEED_ADMIN_PASSWORD.`,
  });
}
