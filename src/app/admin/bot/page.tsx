"use client";

import { useEffect, useState } from "react";

export default function AdminBotPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [form, setForm] = useState({
    label: "",
    type: "youtube_channel",
    value: "",
    defaultCategoryId: "",
  });

  async function load() {
    const [srcRes, catRes] = await Promise.all([
      fetch("/api/admin/bot-sources").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]);
    setSources(srcRes.sources ?? []);
    setLogs(srcRes.logs ?? []);
    setCategories(catRes.categories ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addSource(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label || !form.value) return;
    await fetch("/api/admin/bot-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ label: "", type: "youtube_channel", value: "", defaultCategoryId: "" });
    load();
  }

  async function removeSource(id: string) {
    await fetch(`/api/admin/bot-sources?id=${id}`, { method: "DELETE" });
    load();
  }

  async function runNow() {
    setRunning(true);
    setRunResult(null);
    const res = await fetch("/api/admin/bot/run", { method: "POST" });
    const data = await res.json();
    setRunResult(data);
    setRunning(false);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-black">בוט חיפוש שירים</h1>
        <button
          onClick={runNow}
          disabled={running}
          className="bg-gold hover:bg-gold-light text-ink font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {running ? "סורק..." : "▶ הרצה עכשיו"}
        </button>
      </div>

      <p className="text-sm text-text/60 mb-6 max-w-2xl">
        הבוט סורק ערוצי יוטיוב או מונחי חיפוש שהגדרתם ומוצא שירים חדשים. כל שיר
        שנמצא נכנס כ<b>&quot;ממתין לאישור&quot;</b> ולא מתפרסם באתר עד שתאשרו
        אותו בדף השירים — כך שאתם תמיד שולטים במה שמוצג. הבוט לא מוריד או
        מארח קבצי שמע — הוא רק מקשר לקליפ ביוטיוב.
      </p>

      {runResult && (
        <div className="bg-white/60 border border-ink/10 rounded-xl p-4 mb-6 text-sm">
          נמצאו {runResult.found ?? 0} סרטונים, נוספו {runResult.added ?? 0} שירים חדשים
          לרשימת ההמתנה.
          {runResult.errors?.length > 0 && (
            <p className="text-wine mt-1">שגיאות: {runResult.errors.join(" | ")}</p>
          )}
        </div>
      )}

      <form onSubmit={addSource} className="bg-white/60 border border-ink/10 rounded-xl p-4 mb-6 flex flex-col gap-3 max-w-lg">
        <h2 className="font-bold">הוספת מקור לסריקה</h2>
        <input
          placeholder="שם ידידותי (לדוגמה: ערוץ יוטיוב - יעקב שוואקי)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="border border-ink/20 rounded-lg px-3 py-2 bg-white/70 focus:border-gold outline-none"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border border-ink/20 rounded-lg px-3 py-2 bg-white/70 focus:border-gold outline-none"
        >
          <option value="youtube_channel">ערוץ יוטיוב (channel ID)</option>
          <option value="youtube_search">חיפוש חופשי ביוטיוב</option>
        </select>
        <input
          placeholder={
            form.type === "youtube_channel" ? "Channel ID (מתחיל ב-UC...)" : "מילות חיפוש"
          }
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          className="border border-ink/20 rounded-lg px-3 py-2 bg-white/70 focus:border-gold outline-none"
        />
        <select
          value={form.defaultCategoryId}
          onChange={(e) => setForm({ ...form, defaultCategoryId: e.target.value })}
          className="border border-ink/20 rounded-lg px-3 py-2 bg-white/70 focus:border-gold outline-none"
        >
          <option value="">ללא קטגוריית ברירת מחדל</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="bg-ink text-parchment font-bold px-4 py-2 rounded-lg self-start">
          הוספת מקור
        </button>
      </form>

      <h2 className="font-bold mb-2">מקורות פעילים</h2>
      <div className="bg-white/60 border border-ink/10 rounded-xl divide-y divide-ink/10 mb-8">
        {sources.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-bold">{s.label}</p>
              <p className="text-xs text-text/50">
                {s.type === "youtube_channel" ? "ערוץ" : "חיפוש"} · {s.value} · הרצה אחרונה:{" "}
                {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString("he-IL") : "טרם רץ"}
              </p>
            </div>
            <button onClick={() => removeSource(s.id)} className="text-wine text-sm hover:underline">
              הסרה
            </button>
          </div>
        ))}
        {sources.length === 0 && <p className="px-4 py-6 text-text/50">אין מקורות מוגדרים עדיין.</p>}
      </div>

      <h2 className="font-bold mb-2">היסטוריית הרצות</h2>
      <div className="bg-white/60 border border-ink/10 rounded-xl divide-y divide-ink/10">
        {logs.map((l) => (
          <div key={l.id} className="px-4 py-3 text-sm">
            {new Date(l.startedAt).toLocaleString("he-IL")} — נמצאו {l.found}, נוספו {l.added}
            {l.errors ? ` — שגיאות: ${l.errors}` : ""}
          </div>
        ))}
        {logs.length === 0 && <p className="px-4 py-6 text-text/50">עדיין לא בוצעו הרצות.</p>}
      </div>
    </div>
  );
}
