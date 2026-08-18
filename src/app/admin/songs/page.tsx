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
  const [filter, setFilter] = useState<string>("");

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
    await fetch("/api/admin/songs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("למחוק שיר זה?")) return;
    await fetch(`/api/admin/songs?id=${id}`, { method: "DELETE" });
    load();
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

      <div className="flex gap-2 mb-4 text-sm">
        {["", "PENDING", "PUBLISHED", "HIDDEN"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full border ${
              filter === s ? "bg-wine text-white border-wine" : "border-ink/20"
            }`}
          >
            {s ? STATUS_LABELS[s] : "הכל"}
          </button>
        ))}
      </div>

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
    </div>
  );
}
