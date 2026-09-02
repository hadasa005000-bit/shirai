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

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-ink/10" />
        <span className="text-xs text-text/40">או</span>
        <div className="flex-1 h-px bg-ink/10" />
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="w-full flex items-center justify-center gap-2 border border-ink/20 rounded-full px-5 py-3 font-bold hover:bg-ink/5 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
        </svg>
        הרשמה עם גוגל
      </button>

      <p className="text-sm text-text/60 mt-4">
        כבר רשומים?{" "}
        <Link href="/login" className="text-wine hover:underline">
          כניסה
        </Link>
      </p>
    </div>
  );
}
