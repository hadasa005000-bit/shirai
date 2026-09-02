"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Thread = {
  userId: string;
  name: string;
  email: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unread: number;
};

type Message = {
  id: string;
  senderRole: string;
  text: string;
  createdAt: string;
};

export default function AdminChatPage() {
  return (
    <Suspense fallback={<div className="text-text/50">טוען...</div>}>
      <AdminChatPageInner />
    </Suspense>
  );
}

function AdminChatPageInner() {
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadThreads() {
    const res = await fetch("/api/admin/chat/threads").then((r) => r.json());
    setThreads(res.threads ?? []);
    return res.threads ?? [];
  }

  async function loadMessages(userId: string) {
    const res = await fetch(`/api/admin/chat/messages?userId=${userId}`).then((r) => r.json());
    setMessages(res.messages ?? []);
  }

  // תמיכה בהגעה מ"💬 שלח הודעה" בעמוד המשתמשים - פותח שיחה עם המשתמש
  // הזה גם אם עדיין אין ביניכם אף הודעה (עדיין לא ברשימת השיחות).
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (!userId) return;
    const name = searchParams.get("name") ?? "";
    const email = searchParams.get("email") ?? "";
    setSelected({ userId, name, email, lastMessage: "", lastMessageAt: null, unread: 0 });
  }, [searchParams]);

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.userId);
    const interval = setInterval(() => loadMessages(selected.userId), 4000);
    return () => clearInterval(interval);
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const value = text.trim();
    if (!value || sending || !selected) return;
    setSending(true);
    setText("");
    setMessages((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, senderRole: "admin", text: value, createdAt: new Date().toISOString() },
    ]);
    await fetch("/api/admin/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selected.userId, text: value }),
    });
    await loadMessages(selected.userId);
    await loadThreads();
    setSending(false);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black mb-2">💬 צ'אט עם משתמשים</h1>
      <p className="text-sm text-text/60 mb-6 max-w-2xl">
        כל משתמש רשום רואה רק את השיחה הפרטית שלו מולכם - הם לא רואים
        זה את זה. אפשר גם לפתוח שיחה חדשה עם משתמש ישירות מעמוד
        "משתמשים".
      </p>

      <div className="flex gap-4 h-[32rem] bg-white/60 border border-ink/10 rounded-xl overflow-hidden">
        <div className="w-64 shrink-0 border-l border-ink/10 overflow-y-auto">
          {threads.length === 0 && <p className="p-4 text-sm text-text/50">עדיין אין שיחות.</p>}
          {threads.map((t) => (
            <button
              key={t.userId}
              onClick={() => setSelected(t)}
              className={`w-full text-right px-4 py-3 border-b border-ink/10 hover:bg-wine/5 transition-colors ${
                selected?.userId === t.userId ? "bg-wine/10" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm truncate">{t.name}</span>
                {t.unread > 0 && (
                  <span className="bg-wine text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    {t.unread}
                  </span>
                )}
              </div>
              <p className="text-xs text-text/50 truncate mt-1">{t.lastMessage}</p>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {!selected && (
            <div className="flex-1 flex items-center justify-center text-text/40 text-sm">
              בחרו שיחה מהרשימה מימין
            </div>
          )}
          {selected && (
            <>
              <div className="px-4 py-3 border-b border-ink/10 font-bold text-sm">
                {selected.name} <span className="text-text/40 font-normal">({selected.email})</span>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {messages.length === 0 && (
                  <p className="text-xs text-text/40 text-center mt-6">
                    עדיין אין הודעות - כתבו למשתמש הזה הודעה ראשונה.
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                      m.senderRole === "admin"
                        ? "bg-wine text-white mr-auto rounded-br-sm"
                        : "bg-parchment border border-ink/10 ml-auto rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t border-ink/10 flex gap-2 shrink-0">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="הקלידו הודעה..."
                  className="flex-1 px-3 py-2 rounded-lg border border-ink/20 text-sm"
                />
                <button
                  onClick={send}
                  disabled={sending || !text.trim()}
                  className="bg-wine text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  שלח
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
