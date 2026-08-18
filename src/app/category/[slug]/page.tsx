import { db } from "@/lib/db";
import SongCard from "@/components/SongCard";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = await db.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const songs = await db.song.findMany({
    where: { categoryId: category.id, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: { artist: true, category: true },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <p className="font-mono text-wine text-sm mb-1">קטגוריה</p>
      <h1 className="font-display text-3xl font-black mb-8">{category.name}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
        {songs.length === 0 && (
          <p className="text-text/50 col-span-full">אין עדיין שירים בקטגוריה זו.</p>
        )}
      </div>
    </div>
  );
}
