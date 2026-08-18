import Link from "next/link";
import OnlineCounter from "./OnlineCounter";
import AuthStatus from "./AuthStatus";
import { db } from "@/lib/db";

export default async function Header() {
  const categories = await db.category
    .findMany({ orderBy: { name: "asc" }, take: 6 })
    .catch(() => []);

  return (
    <header className="bg-ink text-parchment sticky top-0 z-40 shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <span
              className="vinyl w-9 h-9 rounded-full border border-gold/40 shrink-0 transition-transform duration-700 group-hover:rotate-180"
              aria-hidden
            />
            <span className="font-display text-xl font-bold tracking-tight">
              היכל <span className="text-gold-light">הניגון</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="text-parchment/80 hover:text-gold-light transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <OnlineCounter />
            <Link
              href="/search"
              className="text-sm text-parchment/80 hover:text-gold-light transition-colors"
            >
              חיפוש
            </Link>
            <AuthStatus />
          </div>
        </div>
      </div>
    </header>
  );
}
