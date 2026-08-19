import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

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
      message: `כבר קיים מנהל במערכת: ${existingAdmin.email}`,
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

  // אם כבר יש משתמש רשום עם האימייל הזה (למשל נרשם דרך /register) —
  // פשוט הופכים אותו למנהל ומעדכנים לו את הסיסמה, במקום ליצור כפול.
  const existingUserWithEmail = await db.user.findUnique({ where: { email: adminEmail } });

  if (existingUserWithEmail) {
    await db.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN", passwordHash },
    });
    return NextResponse.json({
      ok: true,
      message: `המשתמש הקיים ${adminEmail} הפך למנהל. התחברו עם הסיסמה מ-SEED_ADMIN_PASSWORD.`,
    });
  }

  await db.user.create({
    data: { name: "מנהל האתר", email: adminEmail, passwordHash, role: "ADMIN" },
  });

  return NextResponse.json({
    ok: true,
    message: `נוצר משתמש מנהל: ${adminEmail}.`,
  });
}
