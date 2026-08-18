"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/");
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-black mb-6">הרשמה</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם מלא"
          required
          className="border border-ink/20 rounded-lg px-4 py-3 bg-white/70 focus:border-gold outline-none"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="אימייל"
          required
          className="border border-ink/20 rounded-lg px-4 py-3 bg-white/70 focus:border-gold outline-none"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="סיסמה"
          required
          className="border border-ink/20 rounded-lg px-4 py-3 bg-white/70 focus:border-gold outline-none"
        />
        {error && <p className="text-wine text-sm">{error}</p>}
        <button
          disabled={loading}
          className="bg-gold hover:bg-gold-light text-ink font-bold px-5 py-3 rounded-full transition-colors disabled:opacity-50"
        >
          {loading ? "נרשם..." : "הרשמה"}
        </button>
      </form>
      <p className="text-sm text-text/60 mt-4">
        כבר רשומים?{" "}
        <Link href="/login" className="text-wine hover:underline">
          כניסה
        </Link>
      </p>
    </div>
  );
}
