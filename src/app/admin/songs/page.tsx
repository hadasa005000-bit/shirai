"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "ממתין לאישור",
  PUBLISHED: "מפורסם",
  HIDDEN: "מוסתר",
};

export default function AdminSongs() {
  const [songs, setSongs] = useState<any[]>([]);
  // נפתח ישר על "ממתין לאישור" — זו המסך שרוב הזמן תרצו לעבוד בו
  const [filter, setFilter] = useState<string>("PENDING");

  async function load() {
    const res = await fetch(`/api/admin/songs${filter ? `?status=${filter}` : ""}`);
    const data = await res.json();
    setSongs(data.songs ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function setStatus(id: string, status: string) {
    // עדכון מיידי במסך כדי שהכרטיס ייעלם מיד בלחיצה, בלי לחכות לשרת
    setSongs((prev) => prev.filter((s) => s.id !== id));
    await fetch("/api/admin/songs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  async function remove(id: string) {
    setSongs((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/admin/songs?id=${id}`, { method: "DELETE" });
  }

  const isReviewMode = filter === "PENDING";

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

      <div className="flex gap-2 mb-4 text-sm">
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

      {isReviewMode ? (
        // מצב סקירה מהירה: כרטיסים גדולים עם ✓ / ✗ בלבד
        <div className="grid gap-3">
          {songs.map((song) => (
            <div
              key={song.id}
              className="bg-white/60 border border-ink/10 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-center gap-4 min-w-0">
                {song.youtubeId && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://i.ytimg.com/vi/${song.youtubeId}/mqdefault.jpg`}
                    alt=""
                    className="w-24 h-14 object-cover rounded-lg shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-bold truncate">{song.title}</p>
                  <p className="text-xs text-text/50 truncate">
                    {song.artist?.name ?? "—"} · {song.category?.name ?? "ללא קטגוריה"}
                  </p>
                  {song.youtubeId && (
                    <a
                      href={`https://youtube.com/watch?v=${song.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-wine hover:underline"
                    >
                      צפייה ביוטיוב לפני אישור ↗
                    </a>
                  )}
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
          ))}
          {songs.length === 0 && (
            <p className="text-text/50 text-center py-10">
              אין שירים ממתינים לאישור כרגע — הריצו את הבוט מדף &quot;בוט חיפוש
              שירים&quot; כדי למצוא עוד.
            </p>
          )}
        </div>
      ) : (
        // מצב רגיל לשאר הסינונים (הכל / מפורסם / מוסתר)
        <div className="bg-white/60 border border-ink/10 rounded-xl divide-y divide-ink/10">
          {songs.map((song) => (
            <div key={song.id} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-bold truncate">{song.title}</p>
                <p className="text-xs text-text/50">
                  {song.artist?.name ?? "—"} · {song.category?.name ?? "ללא קטגוריה"} ·{" "}
                  {STATUS_LABELS[song.status]} · מקור: {song.source === "bot" ? "בוט" : "ידני"}
                </p>
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
          ))}
          {songs.length === 0 && <p className="px-4 py-6 text-text/50">אין שירים להצגה.</p>}
        </div>
      )}
    </div>
  );
}
