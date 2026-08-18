"use client";

import { useState } from "react";
import SongCard from "@/components/SongCard";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function runSearch(value: string) {
    setQ(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-black mb-6">חיפוש שירים</h1>
      <input
        value={q}
        onChange={(e) => runSearch(e.target.value)}
        placeholder="שם שיר או זמר..."
        className="w-full max-w-md border border-ink/20 rounded-full px-5 py-3 bg-white/70 focus:border-gold outline-none"
        autoFocus
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8">
        {results.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>

      {!loading && q && results.length === 0 && (
        <p className="text-text/50 mt-8">לא נמצאו תוצאות עבור &quot;{q}&quot;.</p>
      )}
    </div>
  );
}
