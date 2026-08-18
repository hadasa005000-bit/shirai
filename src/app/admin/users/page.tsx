"use client";

import { useEffect, useState } from "react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRole(id: string, role: string) {
    const newRole = role === "ADMIN" ? "USER" : "ADMIN";
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: newRole }),
    });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black mb-6">משתמשים</h1>
      <div className="bg-white/60 border border-ink/10 rounded-xl divide-y divide-ink/10">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3 flex-wrap gap-2">
            <div>
              <p className="font-bold">{u.name}</p>
              <p className="text-xs text-text/50">{u.email}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  u.role === "ADMIN" ? "bg-wine/10 text-wine" : "bg-ink/5 text-text/60"
                }`}
              >
                {u.role === "ADMIN" ? "מנהל" : "משתמש"}
              </span>
              <button onClick={() => toggleRole(u.id, u.role)} className="hover:underline text-wine">
                {u.role === "ADMIN" ? "הסרת הרשאות ניהול" : "הפיכה למנהל"}
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="px-4 py-6 text-text/50">אין משתמשים רשומים.</p>}
      </div>
    </div>
  );
}
