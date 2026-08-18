import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import SongCard from "@/components/SongCard";

export const revalidate = 300;

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  const artist = await db.artist.findUnique({
    where: { slug: params.slug },
    include: {
      songs: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        include: { artist: true, category: true },
      },
    },
  });
  if (!artist) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-black mb-2">{artist.name}</h1>
      <p className="text-text/60 mb-8">{artist.songs.length} שירים באתר</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {artist.songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}
