import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import SongCard from "@/components/SongCard";

export const revalidate = 0;

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/login");

  const favorites = await db.favorite
    .findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { song: { include: { artist: true, category: true } } },
    })
    .catch(() => []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-black mb-8">השירים שאהבתי</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {favorites.map((f) => (
          <SongCard key={f.id} song={f.song} />
        ))}
        {favorites.length === 0 && (
          <p className="text-text/50 col-span-full">עדיין לא שמרתם שירים. לחצו ♡ בעמוד של שיר.</p>
        )}
      </div>
    </div>
  );
}
