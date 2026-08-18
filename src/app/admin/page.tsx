import { db } from "@/lib/db";
import { countOnline } from "@/lib/redis";

export const revalidate = 0;

export default async function AdminOverview() {
  const [songs, pending, users, online, totals] = await Promise.all([
    db.song.count(),
    db.song.count({ where: { status: "PENDING" } }),
    db.user.count(),
    countOnline(),
    db.song.aggregate({ _sum: { views: true, downloads: true } }),
  ]);

  const stats = [
    { label: "סה״כ שירים", value: songs },
    { label: "ממתינים לאישור (מהבוט)", value: pending },
    { label: "משתמשים רשומים", value: users },
    { label: "מחוברים כעת", value: online },
    { label: "סה״כ צפיות", value: totals._sum.views ?? 0 },
    { label: "סה״כ הורדות", value: totals._sum.downloads ?? 0 },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-black mb-6">סקירה כללית</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white/60 border border-ink/10 rounded-xl p-4">
            <p className="text-3xl font-mono font-bold text-wine">{s.value}</p>
            <p className="text-sm text-text/60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
