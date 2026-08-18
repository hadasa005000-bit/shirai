"use client";

import { useEffect, useState } from "react";

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");

  async function load() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    load();
  }

  async function remove(id: string) {
    if (!confirm("למחוק קטגוריה זו?")) return;
    await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black mb-6">קטגוריות</h1>
      <form onSubmit={add} className="flex gap-2 mb-6 max-w-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם קטגוריה חדשה"
          className="flex-1 border border-ink/20 rounded-lg px-3 py-2 bg-white/70 focus:border-gold outline-none"
        />
        <button className="bg-gold hover:bg-gold-light text-ink font-bold px-4 py-2 rounded-lg">
          הוספה
        </button>
      </form>

      <ul className="divide-y divide-ink/10 bg-white/60 border border-ink/10 rounded-xl">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3">
            <span>{c.name}</span>
            <button onClick={() => remove(c.id)} className="text-wine text-sm hover:underline">
              מחיקה
            </button>
          </li>
        ))}
        {categories.length === 0 && (
          <li className="px-4 py-3 text-text/50">אין קטגוריות עדיין.</li>
        )}
      </ul>
    </div>
  );
}
