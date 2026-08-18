import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 0;

export default async function SongPage({ params }: { params: { id: string } }) {
  const song = await db.song.findUnique({
    where: { id: params.id },
    include: { artist: true, category: true },
  });
  if (!song || song.status === "HIDDEN") notFound();

  db.song.update({ where: { id: song.id }, data: { views: { increment: 1 } } }).catch(() => {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-4 flex items-center gap-2 text-sm text-text/60">
        {song.category && (
          <Link href={`/category/${song.category.slug}`} className="hover:text-wine">
            {song.category.name}
          </Link>
        )}
      </div>

      <h1 className="font-display text-3xl sm:text-4xl font-black mb-1">{song.title}</h1>
      <p className="text-text/60 mb-6">{song.artist?.name ?? "זמר לא ידוע"}</p>

      {song.youtubeId ? (
        <div className="aspect-video rounded-xl overflow-hidden border border-ink/10 mb-6">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${song.youtubeId}`}
            title={song.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="aspect-video rounded-xl vinyl mb-6" />
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        {song.driveLink && (
          
            href={song.driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold hover:bg-gold-light text-ink font-bold px-5 py-3 rounded-full transition-colors"
          >
            הורדה ⬇
          </a>
        )}
        {song.youtubeId && (
          
            href={`https://youtube.com/watch?v=${song.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-ink/20 hover:border-wine hover:text-wine px-5 py-3 rounded-full transition-colors"
          >
            צפייה ביוטיוב
          </a>
        )}
      </div>

      {song.lyrics && (
        <div className="bg-white/60 border border-ink/10 rounded-xl p-6 whitespace-pre-line leading-relaxed">
          {song.lyrics}
        </div>
      )}
    </div>
  );
}
