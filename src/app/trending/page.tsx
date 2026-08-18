import { db } from "@/lib/db";
import SongCard from "@/components/SongCard";

export const revalidate = 300;

export default async function TrendingPage() {
  const songs = await db.song
    .findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ views: "desc" }, { downloads: "desc" }],
      take: 100,
      include: { artist: true, category: true },
    })
    .catch(() => []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-black mb-2">טופ 100</h1>
      <p className="text-text/60 mb-8">השירים המושמעים והמורדים ביותר באתר.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {songs.map((song, i) => (
          <div key={song.id} className="relative">
            <span className="absolute -top-2 -right-2 z-10 bg-wine text-parchment font-mono text-xs w-7 h-7 rounded-full flex items-center justify-center">
              {i + 1}
            </span>
            <SongCard song={song} />
          </div>
        ))}
        {songs.length === 0 && <p className="text-text/50 col-span-full">אין עדיין נתונים.</p>}
      </div>
    </div>
  );
}
