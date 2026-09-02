"use client";

import { useEffect, useState } from "react";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const maxDaily = data?.daily?.length ? Math.max(...data.daily.map((d: any) => d.count), 1) : 1;

  return (
    <div>
      <h1 className="font-display text-2xl font-black mb-2">פעילות באתר</h1>
      <p className="text-sm text-text/60 mb-6 max-w-2xl">
        כמה כניסות היו לאתר, כולל מבקרים לא-רשומים. נספר פעם אחת ליום
        לכל מבקר (לא בכל רענון דף), כדי שהמספר ישקף כניסות אמיתיות.
      </p>

      {loading && <p className="text-text/50">טוען...</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/60 border border-ink/10 rounded-xl p-4">
              <p className="text-3xl font-mono font-bold text-wine">{data.today}</p>
              <p className="text-sm text-text/60 mt-1">כניסות היום</p>
            </div>
            <div className="bg-white/60 border border-ink/10 rounded-xl p-4">
              <p className="text-3xl font-mono font-bold text-wine">{data.week}</p>
              <p className="text-sm text-text/60 mt-1">כניסות ב-7 ימים אחרונים</p>
            </div>
            <div className="bg-white/60 border border-ink/10 rounded-xl p-4">
              <p className="text-3xl font-mono font-bold text-wine">{data.month}</p>
              <p className="text-sm text-text/60 mt-1">כניסות ב-30 יום אחרונים</p>
            </div>
            <div className="bg-white/60 border border-ink/10 rounded-xl p-4">
              <p className="text-3xl font-mono font-bold text-emerald-700">{data.registeredMonth}</p>
              <p className="text-sm text-text/60 mt-1">מתוכן: משתמשים רשומים (30 יום)</p>
            </div>
            <div className="bg-white/60 border border-ink/10 rounded-xl p-4">
              <p className="text-3xl font-mono font-bold text-amber-700">{data.anonymousMonth}</p>
              <p className="text-sm text-text/60 mt-1">מתוכן: לא רשומים (30 יום)</p>
            </div>
          </div>

          <h2 className="font-bold mb-3">כניסות ל-30 יום אחרונים</h2>
          <div className="bg-white/60 border border-ink/10 rounded-xl p-4">
            <div className="flex items-end gap-1 h-40">
              {data.daily.map((d: any) => (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
                  <div
                    className="w-full bg-wine/70 hover:bg-wine rounded-t transition-colors"
                    style={{ height: `${Math.max((d.count / maxDaily) * 100, d.count > 0 ? 4 : 1)}%` }}
                  />
                  <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-ink text-parchment text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {d.date}: {d.count}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-text/40 mt-2">
              <span>{data.daily[0]?.date}</span>
              <span>{data.daily[data.daily.length - 1]?.date}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
