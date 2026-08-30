"use client";

import { useEffect, useState } from "react";

export default function AdminBotPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [backfillResult, setBackfillResult] = useState<any>(null);
  const [autoPublish, setAutoPublish] = useState<boolean>(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [form, setForm] = useState({
    label: "",
    type: "youtube_search",
    value: "",
    defaultCategoryId: "",
  });

  async function load() {
    const [srcRes, catRes, settingsRes] = await Promise.all([
      fetch("/api/admin/bot-sources").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json()),
    ]);
    setSources(srcRes.sources ?? []);
    setLogs(srcRes.logs ?? []);
    setCategories(catRes.categories ?? []);
    setAutoPublish(!!settingsRes.botAutoPublish);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleAutoPublish() {
    const next = !autoPublish;
    setAutoPublish(next); // עדכון מיידי במסך
    setSavingToggle(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botAutoPublish: next }),
    });
    setSavingToggle(false);
  }

  async function addSource(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label || !form.value) return;
    await fetch("/api/admin/bot-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ label: "", type: "youtube_search", value: "", defaultCategoryId: "" });
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

  async function seedDefaults() {
    setSeeding(true);
    setSeedResult(null);
    const res = await fetch("/api/admin/bot-sources/seed", { method: "POST" });
    const data = await res.json();
    setSeedResult(data);
    setSeeding(false);
    load();
  }

  async function backfillFromApproved() {
    setBackfilling(true);
    setBackfillResult(null);
    const res = await fetch("/api/admin/bot-sources/backfill", { method: "POST" });
    const data = await res.json();
    setBackfillResult(data);
    setBackfilling(false);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-black">בוט חיפוש שירים</h1>
        <div className="flex gap-2">
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="bg-ink text-parchment font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {seeding ? "מוסיף..." : "➕ הוסיפו מקורות חיפוש מובנים"}
          </button>
          <button
            onClick={backfillFromApproved}
            disabled={backfilling}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {backfilling ? "סורק..." : "🌱 צור מקורות משירים שכבר אושרו"}
          </button>
          <button
            onClick={runNow}
            disabled={running}
            className="bg-gold hover:bg-gold-light text-ink font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {running ? "סורק..." : "▶ הרצה עכשיו"}
          </button>
        </div>
      </div>

      {/* המתג המרכזי: אוטומטי מול אישור ידני */}
      <div className="bg-white/70 border border-gold/40 rounded-xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-bold">
            {autoPublish ? "פרסום אוטומטי מופעל" : "כל שיר עובר דרככם לאישור"}
          </p>
          <p className="text-sm text-text/60 mt-0.5">
            {autoPublish
              ? "שירים שהבוט מוצא עולים ישר לאתר החי, בלי לעבור אצלכם."
              : "שירים שהבוט מוצא נכנסים ל\"ממתין לאישור\" ולא יופיעו באתר עד שתלחצו ✓."}
          </p>
        </div>
        <button
          onClick={toggleAutoPublish}
          disabled={savingToggle}
          role="switch"
          aria-checked={autoPublish}
          className={`relative w-16 h-9 rounded-full transition-colors shrink-0 ${
            autoPublish ? "bg-emerald-600" : "bg-ink/20"
          }`}
        >
          <span
            className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow transition-transform ${
              autoPublish ? "-translate-x-1" : "-translate-x-8"
            }`}
            style={{ right: "0.25rem" }}
          />
        </button>
      </div>

      <p className="text-sm text-text/60 mb-3 max-w-2xl">
        הבוט סורק ערוצי יוטיוב או מונחי חיפוש, מסווג כל שיר לקטגוריה לפי
        הכותרת והתיאור באופן אוטומטי, מזהה כפילויות, ומוסיף קישור הורדה.
        הכפתור <b>&quot;הוסיפו מקורות חיפוש מובנים&quot;</b> מוסיף בלחיצה אחת רשימה
        רחבה של חיפושים שמכסה את כל הנושאים — כדי שלא תצטרכו להוסיף ערוץ
        אחרי ערוץ ידנית. אפשר ללחוץ עליו רק פעם אחת; מקורות שכבר קיימים לא
        ייווצרו שוב.
      </p>
      <p className="text-sm text-text/60 mb-3 max-w-2xl">
        הכפתור <b>&quot;צור מקורות משירים שכבר אושרו&quot;</b> עושה משהו אחר: הוא
        סורק את כל השירים שכבר מפורסמים אצלכם, ומחפש אמנים שיש להם כבר
        כמה שירים מאושרים (מכנה משותף חוזר) בלי שיש להם מקור קבוע — ויוצר
        להם אחד. כדאי ללחוץ עליו עכשיו פעם אחת כדי "לתפוס" גם שירים
        שאושרו לפני שהמנגנון הזה נוסף. מאותה נקודה, כל אישור חדש (בין אם
        ידני או דרך הסקריפט המקומי) גם בודק את זה אוטומטית בעצמו.
      </p>
      <p className="text-sm text-text/60 mb-6 max-w-2xl">
        נדרש <b>YOUTUBE_API_KEY</b> במשתני הסביבה כדי לסרוק. הבוט לא מארח
        קבצי שמע — הוא מקשר לקליפ ולקישור ההורדה.
      </p>

      {seedResult && (
        <div className="bg-white/60 border border-ink/10 rounded-xl p-4 mb-4 text-sm">
          נוספו {seedResult.created ?? 0} מקורות חיפוש חדשים.
        </div>
      )}

      {backfillResult && (
        <div className="bg-white/60 border border-ink/10 rounded-xl p-4 mb-4 text-sm">
          נבדקו {backfillResult.artistsScanned ?? 0} אמנים, {backfillResult.artistsAtThreshold ?? 0}{" "}
          מהם עם מספיק שירים מאושרים, ונוצרו {backfillResult.sourcesCreated ?? 0} מקורות חדשים.
        </div>
      )}

      {runResult && (
        <div className="bg-white/60 border border-ink/10 rounded-xl p-4 mb-6 text-sm">
          נמצאו {runResult.found ?? 0} סרטונים, נוספו {runResult.added ?? 0} שירים חדשים.
          {runResult.errors?.length > 0 && (
            <p className="text-wine mt-1">שגיאות: {runResult.errors.join(" | ")}</p>
          )}
        </div>
      )}

      <form onSubmit={addSource} className="bg-white/60 border border-ink/10 rounded-xl p-4 mb-6 flex flex-col gap-3 max-w-lg">
        <h2 className="font-bold">הוספת מקור ידני (אופציונלי)</h2>
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
          <option value="youtube_search">חיפוש חופשי ביוטיוב</option>
          <option value="youtube_channel">ערוץ יוטיוב (channel ID)</option>
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
          <option value="">ללא קטגוריית ברירת מחדל (זיהוי אוטומטי)</option>
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

      <h2 className="font-bold mb-2">מקורות פעילים ({sources.length})</h2>
      <div className="bg-white/60 border border-ink/10 rounded-xl divide-y divide-ink/10 mb-8 max-h-96 overflow-y-auto">
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
