"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewSongPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    artistName: "",
    categoryId: "",
    youtubeId: "",
    driveLink: "",
    lyrics: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: "PUBLISHED" }),
    });
    router.push("/admin/songs");
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-black mb-6">הוספת שיר</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          required
          placeholder="שם השיר"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border border-ink/20 rounded-lg px-4 py-3 bg-white/70 focus:border-gold outline-none"
        />
        <input
          placeholder="שם הזמר"
          value={form.artistName}
          onChange={(e) => setForm({ ...form, artistName: e.target.value })}
          className="border border-ink/20 rounded-lg px-4 py-3 bg-white/70 focus:border-gold outline-none"
        />
        <select
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          className="border border-ink/20 rounded-lg px-4 py-3 bg-white/70 focus:border-gold outline-none"
        >
          <option value="">ללא קטגוריה</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="מזהה סרטון יוטיוב (הקטע שאחרי v=)"
          value={form.youtubeId}
          onChange={(e) => setForm({ ...form, youtubeId: e.target.value })}
          className="border border-ink/20 rounded-lg px-4 py-3 bg-white/70 focus:border-gold outline-none"
        />
        <input
          placeholder="קישור הורדה מגוגל דרייב"
          value={form.driveLink}
          onChange={(e) => setForm({ ...form, driveLink: e.target.value })}
          className="border border-ink/20 rounded-lg px-4 py-3 bg-white/70 focus:border-gold outline-none"
        />
        <textarea
          placeholder="מילות השיר (אופציונלי)"
          value={form.lyrics}
          onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
          rows={5}
          className="border border-ink/20 rounded-lg px-4 py-3 bg-white/70 focus:border-gold outline-none"
        />
        <button
          disabled={saving}
          className="bg-gold hover:bg-gold-light text-ink font-bold px-5 py-3 rounded-full transition-colors disabled:opacity-50"
        >
          {saving ? "שומר..." : "שמירה ופרסום"}
        </button>
      </form>
    </div>
  );
}
