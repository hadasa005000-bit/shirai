"use client";

import { useEffect } from "react";

function getSessionId() {
  let id = sessionStorage.getItem("heichal_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("heichal_session_id", id);
  }
  return id;
}

export default function OnlineHeartbeat() {
  useEffect(() => {
    const id = getSessionId();
    const ping = () => {
      fetch("/api/online", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
        keepalive: true,
      }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 20000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
