"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Message = {
  id: string;
  senderRole: string;
  text: string;
  createdAt: string;
};

export default function SupportChatWidget() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadMessages() {
    const res = await fetch("/api/chat/messages");
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
    setUnread(0); // נטענו וסומנו כנקראו בשרת
  }

  async function pollUnread() {
    const res = await fetch("/api/chat/unread-count");
    if (!res.ok) return;
    const data = await res.json();
    setUnread(data.count ?? 0);
  }

  // בדיקת הודעות ממתינות ברקע, גם כשהחלון סגור - כדי להראות סימן
  useEffect(() => {
    if (status !== "authenticated") return;
    pollUnread();
    const interval = setInterval(pollUnread, 15000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !open) return;
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [status, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setText("");
    setMessages((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, senderRole: "user", text: value, createdAt: new Date().toISOString() },
    ]);
    await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: value }),
    });
    await loadMessages();
    setSending(false);
  }

  const isAuthed = status === "authenticated";

  return (
    <div className="fixed bottom-4 left-4 z-50" dir="rtl">
      {open && isAuthed && (
        <div className="w-80 h-96 bg-parchment border border-ink/20 rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <div className="bg-ink text-parchment px-4 py-3 flex items-center justify-between shrink-0">
            <span className="font-bold text-sm">💬 יש לך רעיון לשיפור? כתבו לנו</span>
            <button onClick={() => setOpen(false)} className="text-parchment/70 hover:text-parchment">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-text/50 text-center mt-6">
                כתבו לנו כל דבר - הצעה לשיפור, שיר שחסר, באג שמצאתם. אנחנו קוראים הכל.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  m.senderRole === "user"
                    ? "bg-wine text-white mr-auto rounded-br-sm"
                    : "bg-white border border-ink/10 ml-auto rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="p-2 border-t border-ink/10 flex gap-2 shrink-0">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="הקלידו הודעה..."
              className="flex-1 px-3 py-2 rounded-lg border border-ink/20 text-sm bg-white"
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className="bg-wine text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              שלח
            </button>
          </div>
        </div>
      )}

      {open && !isAuthed && (
        <div className="w-72 bg-parchment border border-ink/20 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-ink text-parchment px-4 py-3 flex items-center justify-between">
            <span className="font-bold text-sm">💬 דברו איתנו</span>
            <button onClick={() => setOpen(false)} className="text-parchment/70 hover:text-parchment">
              ✕
            </button>
          </div>
          <div className="p-4 text-sm text-text/70">
            <p className="mb-4">כדי לכתוב לנו הצעות לשיפור צריך קודם להירשם (חינם, לוקח דקה).</p>
            <div className="flex flex-col gap-2">
              <Link
                href="/register"
                className="bg-gold hover:bg-gold-light text-ink font-bold text-center px-4 py-2 rounded-full transition-colors"
              >
                הרשמה
              </Link>
              <Link
                href="/login"
                className="border border-ink/20 text-center px-4 py-2 rounded-full hover:bg-ink/5 transition-colors"
              >
                כבר רשומים? כניסה
              </Link>
            </div>
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="relative bg-wine text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl hover:scale-105 transition-transform"
          title="דברו איתנו"
        >
          💬
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-gold text-ink text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
