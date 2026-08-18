"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthStatus() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/login" className="hover:text-gold-light transition-colors">
          כניסה
        </Link>
        <Link
          href="/register"
          className="bg-gold hover:bg-gold-light text-ink font-semibold px-3 py-1.5 rounded-full transition-colors"
        >
          הרשמה
        </Link>
      </div>
    );
  }

  const role = (session.user as any)?.role;

  return (
    <div className="flex items-center gap-3 text-sm">
      {role === "ADMIN" && (
        <Link href="/admin" className="hover:text-gold-light transition-colors">
          ניהול
        </Link>
      )}
      <span className="text-parchment/70 hidden sm:inline">
        שלום, {session.user?.name?.split(" ")[0]}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-parchment/70 hover:text-gold-light transition-colors"
      >
        יציאה
      </button>
    </div>
  );
}
