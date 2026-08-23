"use client";

import { useEffect, useState } from "react";

export default function AdminCategories() {
  const [tab, setTab] = useState<"categories" | "suggestions">("categories");
  const [categories, setCategories] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  async function load() {
    const [catRes, sugRes] = await Promise.all([
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/category-suggestions").then((r) => r.json()),
    ]);
    setCategories(catRes.categories ?? []);
    setSuggestions(sugRes.suggestions ?? []);
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

  async function scanExisting() {
    setScanning(true);
    setScanResult(null);
    const res = await fetch("/api/admin/category-suggestions/scan", { method: "POST" });
    const data = await res.json();
    setScanResult(data);
    setScanning(false);
    load();
  }

  async function decide(id: string, action: "approve" | "reject") {
    setSuggestions((prev) => prev.filter((s) => s.id !== id)); // עדכון מיידי במסך
    await fetch("/api/admin/category-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black mb-6">קטגוריות</h1>

      <div className="flex gap-2 mb-6 text-sm">
        <button
          onClick={() => setTab("categories")}
          className={`px-3 py-1.5 rounded-full border ${
            tab === "categories" ? "bg-wine text-white border-wine" : "border-ink/20"
          }`}
        >
          קטגוריות קיימות
        </button>
        <button
          onClick={() => setTab("suggestions")}
          className={`px-3 py-1.5 rounded-full border ${
            tab === "suggestions" ? "bg-wine text-white border-wine" : "border-ink/20"
          }`}
        >
          קטגוריות ממתינות לאישור
          {suggestions.length > 0 ? ` (${suggestions.length})` : ""}
        </button>
      </div>

      {tab === "categories" ? (
        <>
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
        </>
      ) : (
        <>
          <p className="text-sm text-text/60 mb-4 max-w-2xl">
            הבוט מזהה נושאים חוזרים (כמו חגים) שאין להם עדיין קטגוריה, ומציע
            אותם כאן במקום ליצור לבד. אישור יוצר את הקטגוריה ומשייך אליה גם
            שירים קיימים שכבר מתאימים לה.
          </p>

          <button
            onClick={scanExisting}
            disabled={scanning}
            className="bg-ink text-parchment font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50 mb-4"
          >
            {scanning ? "סורק..." : "🔍 סרוק שירים קיימים ללא קטגוריה"}
          </button>

          {scanResult && (
            <div className="bg-white/60 border border-ink/10 rounded-xl p-4 mb-4 text-sm">
              נסרקו {scanResult.scanned} שירים, נוצרו {scanResult.suggested} הצעות חדשות.
            </div>
          )}

          <div className="grid gap-3">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="bg-white/60 border border-ink/10 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
              >
                <div>
                  <p className="font-bold text-lg">{s.name}</p>
                  <p className="text-xs text-text/50">
                    זוהה {s.matchCount} פעמים · מילת מפתח: &quot;{s.keyword}&quot;
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => decide(s.id, "approve")}
                    title="אישור ויצירת קטגוריה"
                    className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-2xl font-bold flex items-center justify-center transition-colors"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => decide(s.id, "reject")}
                    title="דחייה"
                    className="w-12 h-12 rounded-full bg-wine hover:bg-red-800 text-white text-2xl font-bold flex items-center justify-center transition-colors"
                  >
                    ✗
                  </button>
                </div>
              </div>
            ))}
            {suggestions.length === 0 && (
              <p className="text-text/50 text-center py-10">
                אין הצעות קטגוריה חדשות ממתינות כרגע.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
