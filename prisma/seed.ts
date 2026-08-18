import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "[email protected]";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "מנהל האתר",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Seed complete. Admin login:", adminEmail, "/", adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
