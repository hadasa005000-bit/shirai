import Link from "next/link";
import { db } from "@/lib/db";
import SongCard from "@/components/SongCard";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, latestSongs] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }).catch(() => []),
    db.song
      .findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { artist: true, category: true },
      })
      .catch(() => []),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-ink text-parchment relative overflow-hidden">
        <div className="absolute inset-0 bg-grooves opacity-40" aria-hidden />
        <div className="max-w-6xl mx-auto px-4 py-20 relative">
          <p className="font-mono text-gold-light text-sm tracking-widest mb-3">
            שיר חדש עולה כמעט כל יום
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-black leading-tight max-w-2xl">
            עולם הניגון החסידי,
            <br />
            מסודר לפי הרגע שלך.
          </h1>
          <p className="mt-4 text-parchment/70 max-w-xl">
            אלפי שירים חסידיים וחרדיים — לשבת, לשמחה, להתעוררות ולעוד — עם צפייה
            בקליפ והורדה, מתעדכן אוטומטית על ידי בוט שסורק מקורות חדשים.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/search"
              className="bg-gold hover:bg-gold-light text-ink font-bold px-5 py-3 rounded-full transition-colors"
            >
              חפשו שיר
            </Link>
            <Link
              href="/register"
              className="border border-parchment/30 hover:border-gold-light hover:text-gold-light px-5 py-3 rounded-full transition-colors"
            >
              הצטרפו בחינם
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-display text-2xl font-bold mb-6">לפי נושא</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="bg-white/60 border border-ink/10 hover:border-gold/60 rounded-xl p-4 text-center font-display font-bold text-text hover:text-wine transition-colors"
            >
              {c.name}
            </Link>
          ))}
          {categories.length === 0 && (
            <p className="text-text/50 col-span-full">
              עדיין אין קטגוריות — הוסיפו אותן מהדשבורד לניהול.
            </p>
          )}
        </div>
      </section>

      {/* Latest */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-display text-2xl font-bold mb-6">שירים חדשים</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {latestSongs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
          {latestSongs.length === 0 && (
            <p className="text-text/50 col-span-full">
              עדיין אין שירים מפורסמים — הוסיפו שירים או הריצו את הבוט מהדשבורד.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
