"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function FavoriteButton({ songId }: { songId: string }) {
  const { status } = useSession();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => setActive((d.favorites ?? []).includes(songId)))
      .catch(() => {});
  }, [status, songId]);

  if (status !== "authenticated") {
    return (
      <Link
        href="/login"
        className="border border-ink/20 hover:border-wine hover:text-wine px-5 py-3 rounded-full transition-colors"
      >
        התחברו כדי לשמור ♡
      </Link>
    );
  }

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songId }),
    });
    const data = await res.json();
    setActive(Boolean(data.favorite));
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={active}
      className={
        active
          ? "bg-wine text-parchment px-5 py-3 rounded-full transition-colors disabled:opacity-60"
          : "border border-ink/20 hover:border-wine hover:text-wine px-5 py-3 rounded-full transition-colors disabled:opacity-60"
      }
    >
      {active ? "נשמר ♥" : "שמירה ♡"}
    </button>
  );
}
