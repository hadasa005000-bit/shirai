"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "ממתין לאישור",
  PUBLISHED: "מפורסם",
  HIDDEN: "מוסתר",
};

const SORT_LABELS: Record<string, string> = {
  newest: "החדשים ביותר",
  oldest: "הישנים ביותר",
  az: "לפי א-ב (שם השיר)",
};

function SongThumb({
  youtubeId,
  expanded,
  onToggle,
}: {
  youtubeId: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!youtubeId) {
    return <div className="w-28 h-16 rounded-lg bg-ink/10 shrink-0" />;
  }
  return (
    <button
      onClick={onToggle}
      title={expanded ? "סגירת התצוגה" : "לחצו לצפייה בסרטון כאן"}
      className="relative w-28 h-16 rounded-lg overflow-hidden shrink-0 group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`}
        alt=""
        className="w-full h-full object-cover"
      />
      <span className="absolute inset-0 bg-black/30 group-hover:bg-black/50 flex items-center justify-center text-white text-xl transition-colors">
        {expanded ? "✕" : "▶"}
      </span>
    </button>
  );
}

function InlinePlayer({ youtubeId }: { youtubeId: string }) {
  return (
    <div className="w-full aspect-video max-w-xl rounded-lg overflow-hidden border border-ink/10 mt-3">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
        title="תצוגה מקדימה"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function OrganizeEditor({
  song,
  categories,
  artists,
  onSaved,
  onClose,
}: {
  song: any;
  categories: any[];
  artists: any[];
  onSaved: (updated: any) => void;
  onClose: () => void;
}) {
  const [artistName, setArtistName] = useState(song.artist?.name ?? "");
  const [categoryId, setCategoryId] = useState(song.category?.id ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/songs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: song.id,
        artistName: artistName.trim(),
        categoryId: categoryId || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.song) onSaved(data.song);
    onClose();
  }

  return (
    <div className="mt-3 bg-parchment/80 border border-gold/40 rounded-lg p-3 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text/60">זמר / מקהלה</label>
        <input
          list={`artists-datalist-${song.id}`}
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          placeholder="הקלידו שם — קיים או חדש"
          className="border border-ink/20 rounded-lg px-3 py-1.5 bg-white/80 focus:border-gold outline-none min-w-[180px]"
        />
        <datalist id={`artists-datalist-${song.id}`}>
          {artists.map((a) => (
            <option key={a.id} value={a.name} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-text/60">קטגוריה</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border border-ink/20 rounded-lg px-3 py-1.5 bg-white/80 focus:border-gold outline-none min-w-[160px]"
        >
          <option value="">ללא קטגוריה</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bg-ink text-parchment font-bold px-4 py-1.5 rounded-lg text-sm disabled:opacity-50"
      >
        {saving ? "שומר..." : "שמירה"}
      </button>
      <button onClick={onClose} className="text-text/60 text-sm hover:underline">
        ביטול
      </button>
    </div>
  );
}

export default function AdminSongs() {
  const [songs, setSongs] = useState<any[]>([]);
  const [categoriesFull, setCategoriesFull] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("PENDING");
  const [sort, setSort] = useState<string>("newest");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [organizingId, setOrganizingId] = useState<string | null>(null);

  async function load() {
    const [songsRes, catRes, artistsRes] = await Promise.all([
      fetch(`/api/admin/songs${filter ? `?status=${filter}` : ""}`).then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/artists").then((r) => r.json()),
    ]);
    setSongs(songsRes.songs ?? []);
    setCategoriesFull(catRes.categories ?? []);
    setArtists(artistsRes.artists ?? []);
  }

  useEffect(() => {
    load();
    setExpandedId(null);
    setOrganizingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function applyUpdatedSong(updated: any) {
    setSongs((prev) =>
      prev.map((s) =>
        s.id === updated.id
          ? {
              ...s,
              artist: artists.find((a) => a.id === updated.artistId) ?? s.artist,
              category: categoriesFull.find((c) => c.id === updated.categoryId) ?? null,
            }
          : s
      )
    );
    load(); // רענון מלא כדי לוודא שהכל מסונכרן (למשל זמר חדש שנוצר)
  }

  async function setStatus(id: string, status: string) {
    setSongs((prev) => prev.filter((s) => s.id !== id));
    if (expandedId === id) setExpandedId(null);
    await fetch("/api/admin/songs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  async function remove(id: string) {
    setSongs((prev) => prev.filter((s) => s.id !== id));
    if (expandedId === id) setExpandedId(null);
    await fetch(`/api/admin/songs?id=${id}`, { method: "DELETE" });
  }

  const categoryOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const s of songs) {
      if (s.category) set.set(s.category.id, s.category.name);
    }
    return Array.from(set.entries());
  }, [songs]);

  const visibleSongs = useMemo(() => {
    let list = songs;
    if (categoryFilter) {
      list = list.filter((s) => s.category?.id === categoryFilter);
    }
    const sorted = [...list];
    if (sort === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === "oldest") {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sort === "az") {
      sorted.sort((a, b) => a.title.localeCompare(b.title, "he"));
    }
    return sorted;
  }, [songs, sort, categoryFilter]);

  const isReviewMode = filter === "PENDING";

  function renderOrganizeToggle(song: any) {
    return (
      <button
        onClick={() => setOrganizingId((prev) => (prev === song.id ? null : song.id))}
        className="text-xs text-ink/70 hover:text-wine border border-ink/20 rounded-full px-2 py-0.5"
      >
        🗂 ארגון
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-black">שירים</h1>
        <Link
          href="/admin/songs/new"
          className="bg-gold hover:bg-gold-light text-ink font-bold px-4 py-2 rounded-lg text-sm"
        >
          + הוספת שיר ידנית
        </Link>
      </div>

      <div className="flex gap-2 mb-4 text-sm flex-wrap">
        {["PENDING", "", "PUBLISHED", "HIDDEN"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full border ${
              filter === s ? "bg-wine text-white border-wine" : "border-ink/20"
            }`}
          >
            {s ? STATUS_LABELS[s] : "הכל"}
            {s === "PENDING" && songs.length > 0 && filter === "PENDING" ? ` (${songs.length})` : ""}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6 flex-wrap items-center text-sm">
        <label className="flex items-center gap-2">
          <span className="text-text/60">מיון:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-ink/20 rounded-lg px-2 py-1.5 bg-white/70 focus:border-gold outline-none"
          >
            {Object.entries(SORT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {categoryOptions.length > 0 && (
          <label className="flex items-center gap-2">
            <span className="text-text/60">קטגוריה:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-ink/20 rounded-lg px-2 py-1.5 bg-white/70 focus:border-gold outline-none"
            >
              <option value="">הכל</option>
              {categoryOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {isReviewMode ? (
        <div className="grid gap-3">
          {visibleSongs.map((song) => (
            <div key={song.id} className="bg-white/60 border border-ink/10 rounded-xl p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 min-w-0">
                  <SongThumb
                    youtubeId={song.youtubeId}
                    expanded={expandedId === song.id}
                    onToggle={() => toggleExpand(song.id)}
                  />
                  <div className="min-w-0">
                    <p className="font-bold truncate">{song.title}</p>
                    <p className="text-xs text-text/50 truncate">
                      {song.artist?.name ?? "—"} · {song.category?.name ?? "ללא קטגוריה"} ·{" "}
                      {new Date(song.createdAt).toLocaleDateString("he-IL")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {song.youtubeId && (
                        <button
                          onClick={() => toggleExpand(song.id)}
                          className="text-xs text-wine hover:underline"
                        >
                          {expandedId === song.id ? "סגירת הנגן" : "▶ צפייה כאן"}
                        </button>
                      )}
                      {renderOrganizeToggle(song)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setStatus(song.id, "PUBLISHED")}
                    title="אישור ופרסום"
                    className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-2xl font-bold flex items-center justify-center transition-colors"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => remove(song.id)}
                    title="דחייה ומחיקה"
                    className="w-12 h-12 rounded-full bg-wine hover:bg-red-800 text-white text-2xl font-bold flex items-center justify-center transition-colors"
                  >
                    ✗
                  </button>
                </div>
              </div>
              {expandedId === song.id && song.youtubeId && <InlinePlayer youtubeId={song.youtubeId} />}
              {organizingId === song.id && (
                <OrganizeEditor
                  song={song}
                  categories={categoriesFull}
                  artists={artists}
                  onSaved={applyUpdatedSong}
                  onClose={() => setOrganizingId(null)}
                />
              )}
            </div>
          ))}
          {visibleSongs.length === 0 && (
            <p className="text-text/50 text-center py-10">
              {songs.length === 0
                ? 'אין שירים ממתינים לאישור כרגע — הריצו את הבוט מדף "בוט חיפוש שירים" כדי למצוא עוד.'
                : "אין שירים בקטגוריה שנבחרה."}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {visibleSongs.map((song) => (
            <div key={song.id} className="bg-white/60 border border-ink/10 rounded-xl p-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <SongThumb
                    youtubeId={song.youtubeId}
                    expanded={expandedId === song.id}
                    onToggle={() => toggleExpand(song.id)}
                  />
                  <div className="min-w-0">
                    <p className="font-bold truncate">{song.title}</p>
                    <p className="text-xs text-text/50">
                      {song.artist?.name ?? "—"} · {song.category?.name ?? "ללא קטגוריה"} ·{" "}
                      {STATUS_LABELS[song.status]} · מקור: {song.source === "bot" ? "בוט" : "ידני"} ·{" "}
                      {new Date(song.createdAt).toLocaleDateString("he-IL")}
                    </p>
                    <div className="mt-1">{renderOrganizeToggle(song)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm shrink-0">
                  {song.status !== "PUBLISHED" && (
                    <button
                      onClick={() => setStatus(song.id, "PUBLISHED")}
                      className="text-emerald-700 hover:underline"
                    >
                      פרסום
                    </button>
                  )}
                  {song.status !== "HIDDEN" && (
                    <button
                      onClick={() => setStatus(song.id, "HIDDEN")}
                      className="text-amber-700 hover:underline"
                    >
                      הסתרה
                    </button>
                  )}
                  <button onClick={() => remove(song.id)} className="text-wine hover:underline">
                    מחיקה
                  </button>
                </div>
              </div>
              {expandedId === song.id && song.youtubeId && <InlinePlayer youtubeId={song.youtubeId} />}
              {organizingId === song.id && (
                <OrganizeEditor
                  song={song}
                  categories={categoriesFull}
                  artists={artists}
                  onSaved={applyUpdatedSong}
                  onClose={() => setOrganizingId(null)}
                />
              )}
            </div>
          ))}
          {visibleSongs.length === 0 && <p className="px-4 py-6 text-text/50">אין שירים להצגה.</p>}
        </div>
      )}
    </div>
  );
}
