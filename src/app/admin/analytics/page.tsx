"use client";

import { useEffect, useState } from "react";

function fmtIsraelTime(iso: string) {
  return new Date(iso).toLocaleString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<any>(null);
  const [loadingDay, setLoadingDay] = useState(false);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  async function toggleDay(date: string) {
    if (openDay === date) {
      setOpenDay(null);
      setDayDetail(null);
      return;
    }
    setOpenDay(date);
    setLoadingDay(true);
    const res = await fetch(`/api/admin/analytics/day?date=${date}`).then((r) => r.json());
    setDayDetail(res);
    setLoadingDay(false);
  }

  const rows = view === "daily" ? data?.daily : data?.monthly;
  const keyField = view === "daily" ? "date" : "month";
  const maxVal = rows?.length ? Math.max(...rows.map((d: any) => d.count), 1) : 1;

  return (
    <div>
      <h1 className="font-display text-2xl font-black mb-2">פעילות באתר</h1>
      <p className="text-sm text-text/60 mb-6 max-w-2xl">
        כמה כניסות היו לאתר, כולל מבקרים לא-רשומים. נספר פעם אחת ליום
        לכל מבקר (לא בכל רענון דף). לחצו על עמודה כדי לראות פירוט ביקורים
        (שעה, IP, ומשתמש רשום אם יש) - שימו לב: כתובת IP לבדה לא חושפת שם
        או זהות של מבקר אנונימי, לכל היותר עיר/מדינה משוערת.
      </p>

      {loading && <p className="text-text/50">טוען...</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/60 border border-ink/10 rounded-xl p-4">
              <p className="text-3xl font-mono font-bold text-wine">{data.today}</p>
              <p className="text-sm text-text/60 mt-1">היום</p>
            </div>
            <div className="bg-white/60 border border-ink/10 rounded-xl p-4">
              <p className="text-3xl font-mono font-bold text-wine">{data.week}</p>
              <p className="text-sm text-text/60 mt-1">7 ימים אחרונים</p>
            </div>
            <div className="bg-white/60 border border-ink/10 rounded-xl p-4">
              <p className="text-3xl font-mono font-bold text-wine">{data.month}</p>
              <p className="text-sm text-text/60 mt-1">30 יום אחרונים</p>
            </div>
            <div className="bg-white/60 border border-ink/10 rounded-xl p-4">
              <p className="text-3xl font-mono font-bold text-wine">{data.year}</p>
              <p className="text-sm text-text/60 mt-1">365 יום אחרונים</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
            <div className="bg-white/60 border border-ink/10 rounded-xl p-4">
              <p className="text-2xl font-mono font-bold text-emerald-700">{data.registeredMonth}</p>
              <p className="text-sm text-text/60 mt-1">רשומים (30 יום)</p>
            </div>
            <div className="bg-white/60 border border-ink/10 rounded-xl p-4">
              <p className="text-2xl font-mono font-bold text-amber-700">{data.anonymousMonth}</p>
              <p className="text-sm text-text/60 mt-1">לא רשומים (30 יום)</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">
              {view === "daily" ? "כניסות ל-30 יום אחרונים" : "כניסות ל-12 חודשים אחרונים"}
            </h2>
            <div className="flex gap-1 text-sm">
              <button
                onClick={() => setView("daily")}
                className={`px-3 py-1 rounded-lg border ${view === "daily" ? "bg-wine text-white border-wine" : "border-ink/20"}`}
              >
                יומי
              </button>
              <button
                onClick={() => setView("monthly")}
                className={`px-3 py-1 rounded-lg border ${view === "monthly" ? "bg-wine text-white border-wine" : "border-ink/20"}`}
              >
                שנתי (לפי חודש)
              </button>
            </div>
          </div>

          <div className="bg-white/60 border border-ink/10 rounded-xl p-4 mb-4">
            <div className="flex items-end gap-1 h-40">
              {rows.map((d: any) => {
                const key = d[keyField];
                return (
                  <button
                    key={key}
                    onClick={() => view === "daily" && toggleDay(key)}
                    disabled={view !== "daily"}
                    className="flex-1 flex flex-col items-center justify-end group relative disabled:cursor-default"
                    title={view === "daily" ? "לחצו לפירוט" : undefined}
                  >
                    <div
                      className={`w-full rounded-t transition-colors ${
                        openDay === key ? "bg-gold" : "bg-wine/70 group-hover:bg-wine"
                      }`}
                      style={{ height: `${Math.max((d.count / maxVal) * 100, d.count > 0 ? 4 : 1)}%` }}
                    />
                    <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-ink text-parchment text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {key}: {d.count}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-text/40 mt-2">
              <span>{rows[0]?.[keyField]}</span>
              <span>{rows[rows.length - 1]?.[keyField]}</span>
            </div>
          </div>

          {view === "daily" && openDay && (
            <div className="bg-white/60 border border-ink/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 font-bold border-b border-ink/10">
                פירוט ביקורים — {openDay} {dayDetail ? `(${dayDetail.count})` : ""}
              </div>
              {loadingDay && <p className="px-4 py-6 text-text/50">טוען...</p>}
              {!loadingDay && dayDetail?.visits?.length === 0 && (
                <p className="px-4 py-6 text-text/50">אין ביקורים ביום הזה.</p>
              )}
              {!loadingDay && dayDetail?.visits?.length > 0 && (
                <div className="divide-y divide-ink/10 max-h-96 overflow-y-auto">
                  {dayDetail.visits.map((v: any) => (
                    <div key={v.id} className="px-4 py-2 text-sm flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-text/50 font-mono text-xs">{fmtIsraelTime(v.time)}</span>
                      <span className="font-mono text-xs text-text/70">{v.ip ?? "לא ידוע"}</span>
                      <span>
                        {v.registered ? (
                          <span className="text-emerald-700 font-bold">
                            👤 {v.registered.name} ({v.registered.email})
                          </span>
                        ) : (
                          <span className="text-text/40">אנונימי</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
