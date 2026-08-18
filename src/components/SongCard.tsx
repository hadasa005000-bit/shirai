import Link from "next/link";

type Props = {
  song: {
    id: string;
    title: string;
    youtubeId: string | null;
    artist?: { name: string } | null;
    category?: { name: string; slug: string } | null;
  };
};

export default function SongCard({ song }: Props) {
  const thumb = song.youtubeId
    ? `https://i.ytimg.com/vi/${song.youtubeId}/hqdefault.jpg`
    : null;

  return (
    <Link
      href={`/song/${song.id}`}
      className="group block bg-white/60 border border-ink/10 rounded-xl overflow-hidden hover:border-gold/60 hover:shadow-lg transition-all"
    >
      <div className="aspect-video bg-ink relative overflow-hidden">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full vinyl" />
        )}
        <span className="absolute bottom-2 left-2 bg-ink/80 text-gold-light text-xs px-2 py-0.5 rounded-full font-mono">
          ▶ צפייה
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-display font-bold text-text truncate">{song.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-text/60 truncate">
            {song.artist?.name ?? "זמר לא ידוע"}
          </span>
          {song.category && (
            <span className="text-xs bg-wine/10 text-wine px-2 py-0.5 rounded-full shrink-0">
              {song.category.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
