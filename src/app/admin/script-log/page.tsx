"use client";

import { useEffect, useState } from "react";

export default function ScriptLogPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<any[]>([]);

  async function loadRuns() {
    const res = await fetch("/api/admin/script-log");
    const data = await res.json();
    setRuns(data.runs ?? []);
  }

  async function loadDecisions(runId: string) {
    setSelectedRun(runId);
    const res = await fetch(`/api/admin/script-log?runId=${runId}`);
    const data = await res.json();
    setDecisions(data.decisions ?? []);
  }

  useEffect(() => {
    loadRuns();
  }, []);

  async function revert(decisionId: string) {
    setDecisions((prev) =>
      prev.map((d) => (d.id === decisionId ? { ...d, reverted: true } : d))
    );
    await fetch("/api/admin/script-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisionId }),
    });
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black mb-2">יומן הסקריפט המקומי</h1>
      <p className="text-sm text-text/60 mb-6 max-w-2xl">
        כל הרצה של הסקריפט שאתם מריצים במחשב שלכם מתועדת כאן — אילו שירים
        נבדקו, מה הוחלט, ולמה. לוחצים על הרצה כדי לראות את הפירוט המלא,
        ואפשר לבטל (להחזיר ל&quot;ממתין לאישור&quot;) כל שיר בודד שאושר בטעות.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold mb-2">הרצות אחרונות</h2>
          <div className="bg-white/60 border border-ink/10 rounded-xl divide-y divide-ink/10">
            {runs.map((r) => (
              <button
                key={r.id}
                onClick={() => loadDecisions(r.id)}
                className={`w-full text-right px-4 py-3 hover:bg-gold/10 transition-colors ${
                  selectedRun === r.id ? "bg-gold/20" : ""
                }`}
              >
                <p className="text-sm font-bold">
                  {new Date(r.startedAt).toLocaleString("he-IL")}
                  {r.dryRun && <span className="text-xs text-amber-700 mr-2">(בדיקה בלבד)</span>}
                </p>
                <p className="text-xs text-text/50">
                  נבדקו {r.checked} · אושרו {r.approved} · לא אושרו {r.skipped}
                  {!r.finishedAt && " · עדיין רץ"}
                </p>
              </button>
            ))}
            {runs.length === 0 && <p className="px-4 py-6 text-text/50">אין הרצות עדיין.</p>}
          </div>
        </div>

        <div>
          <h2 className="font-bold mb-2">
            {selectedRun ? "פירוט ההחלטות" : "בחרו הרצה משמאל"}
          </h2>
          <div className="bg-white/60 border border-ink/10 rounded-xl divide-y divide-ink/10 max-h-[600px] overflow-y-auto">
            {decisions.map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{d.title}</p>
                  <p className="text-xs text-text/50">
                    {d.verdict === "allowed" ? "✅ נמצא פתוח" : "🚫 נחסם / שגיאה"} ·{" "}
                    {d.action === "approved"
                      ? "אושר לאתר"
                      : d.action === "dry_run"
                      ? "בדיקה בלבד"
                      : "נשאר בהמתנה"}
                    {d.reverted && " · בוטל"}
                  </p>
                </div>
                {d.action === "approved" && !d.reverted && (
                  <button
                    onClick={() => revert(d.id)}
                    className="text-wine text-sm hover:underline shrink-0"
                  >
                    ביטול
                  </button>
                )}
              </div>
            ))}
            {selectedRun && decisions.length === 0 && (
              <p className="px-4 py-6 text-text/50">אין נתונים להצגה.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
