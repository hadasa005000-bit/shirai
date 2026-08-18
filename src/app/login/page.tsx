"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("אימייל או סיסמה שגויים");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-black mb-6">כניסה</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
          {loading ? "מתחבר..." : "כניסה"}
        </button>
      </form>
      <p className="text-sm text-text/60 mt-4">
        עדיין אין לכם חשבון?{" "}
        <Link href="/register" className="text-wine hover:underline">
          הרשמה
        </Link>
      </p>
    </div>
  );
}
