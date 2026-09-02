"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

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
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadMessages() {
    const res = await fetch("/api/chat/messages");
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
  }

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

  if (status !== "authenticated") return null;

  return (
    <div className="fixed bottom-4 left-4 z-50" dir="rtl">
      {open ? (
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
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-wine text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl hover:scale-105 transition-transform"
          title="דברו איתנו"
        >
          💬
        </button>
      )}
    </div>
  );
}
