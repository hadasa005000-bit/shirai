import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/login");
  }

  const links = [
    { href: "/admin", label: "סקירה כללית" },
    { href: "/admin/songs", label: "שירים" },
    { href: "/admin/categories", label: "קטגוריות" },
    { href: "/admin/bot", label: "בוט חיפוש שירים" },
    { href: "/admin/users", label: "משתמשים" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      <aside className="md:w-56 shrink-0">
        <h2 className="font-display font-bold text-lg mb-4">דשבורד ניהול</h2>
        <nav className="flex md:flex-col gap-1 flex-wrap">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded-lg hover:bg-wine/10 hover:text-wine text-sm transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
