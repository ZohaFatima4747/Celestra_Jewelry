import React, { useEffect, useState, useCallback } from "react";
import { MSG_URL } from "../utils/api";
import { getUserId, getUserEmail } from "../utils/auth";

const TYPE_META = {
  order_placed:    { emoji: "🎉", accent: "#22c55e" },
  order_cancelled: { emoji: "❌", accent: "#ef4444" },
  status_update:   { emoji: "📦", accent: "#3b82f6" },
};

const UserMessages = ({ isDark }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");

  const userId    = getUserId();
  const userEmail = getUserEmail() || localStorage.getItem("guestEmail") || null;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const uid        = userId || "guest";
      const emailParam = userEmail ? `?email=${encodeURIComponent(userEmail)}` : "";
      const res        = await fetch(`${MSG_URL}/user/${uid}${emailParam}`);
      const data       = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const markRead = async (msgId, e) => {
    e?.stopPropagation();
    try {
      await fetch(`${MSG_URL}/${msgId}/read`, { method: "PATCH" });
      setMessages((prev) => prev.map((m) => m._id === msgId ? { ...m, isRead: true } : m));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      const uid = userId || "guest";
      await fetch(`${MSG_URL}/user/${uid}/read-all`, { method: "PATCH" });
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const displayed   = filter === "unread" ? messages.filter((m) => !m.isRead) : messages;
  const unreadCount = messages.filter((m) => !m.isRead).length;

  const fmt = (iso) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const s = styles(isDark);

  if (loading) return (
    <div style={s.center}>
      <div style={s.spinner} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={s.wrap}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.heading}>Messages</h2>
          <p style={s.sub}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        <div style={s.headerRight}>
          <div style={s.filterGroup}>
            {["all", "unread"].map((f) => (
              <button
                key={f}
                style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button style={s.readAllBtn} onClick={markAllRead}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {displayed.length === 0 && (
        <div style={s.empty}>
          <div style={s.emptyIcon}>💬</div>
          <p style={s.emptyText}>
            {filter === "unread" ? "No unread messages" : "No messages yet"}
          </p>
          <p style={s.emptySub}>Order notifications will appear here.</p>
        </div>
      )}

      {/* Message list */}
      <div style={s.list}>
        {displayed.map((msg) => {
          const meta = TYPE_META[msg.type] || TYPE_META.order_placed;
          return (
            <div
              key={msg._id}
              style={{
                ...s.card,
                ...(msg.isRead ? {} : s.cardUnread),
                borderLeft: `4px solid ${meta.accent}`,
              }}
            >
              <div style={s.cardTop}>
                <span style={s.emoji}>{meta.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={s.cardTitle}>{msg.title}</div>
                  {msg.orderId && (
                    <div style={s.orderId}>
                      Order ID: #{String(msg.orderId).slice(-8).toUpperCase()}
                    </div>
                  )}
                </div>
                <span style={s.time}>{fmt(msg.createdAt)}</span>
              </div>

              <p style={s.body}>{msg.body}</p>

              <div style={s.cardFooter}>
                <span style={{
                  ...s.badge,
                  background: msg.isRead ? (isDark ? "#1e293b" : "#f1f5f9") : meta.accent + "22",
                  color:      msg.isRead ? (isDark ? "#64748b" : "#94a3b8") : meta.accent,
                }}>
                  {msg.isRead ? "Read" : "Unread"}
                </span>
                {!msg.isRead && (
                  <button
                    style={s.markReadBtn}
                    onClick={(e) => markRead(msg._id, e)}
                  >
                    ✓ Mark as read
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = (isDark) => {
  const cardBg   = isDark ? "#16213e" : "#ffffff";
  const text      = isDark ? "#e2e8f0" : "#1a202c";
  const sub       = isDark ? "#94a3b8" : "#64748b";
  const border    = isDark ? "#2d3748" : "#e2e8f0";
  const unreadBg  = isDark ? "#1e2d45" : "#f0f7ff";
  const wrapBg    = isDark ? "#0f172a" : "#f8fafc";

  return {
    wrap:        { padding: "24px", maxWidth: "760px", margin: "0 auto" },
    center:      { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "200px", gap: "12px" },
    spinner:     { width: "36px", height: "36px", border: "3px solid #e2e8f0", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    header:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "24px" },
    heading:     { margin: 0, fontSize: "22px", fontWeight: 700, color: text },
    sub:         { margin: "4px 0 0", fontSize: "13px", color: sub },
    headerRight: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
    filterGroup: { display: "flex", background: isDark ? "#0f172a" : "#f1f5f9", borderRadius: "8px", padding: "3px" },
    filterBtn:   { padding: "5px 14px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 500, background: "transparent", color: sub },
    filterActive: { background: isDark ? "#1e293b" : "#ffffff", color: text, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    readAllBtn:  { padding: "6px 14px", border: "1px solid #6366f1", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: "#6366f1", background: "transparent" },
    empty:       { textAlign: "center", padding: "60px 20px" },
    emptyIcon:   { fontSize: "48px", marginBottom: "12px" },
    emptyText:   { margin: 0, fontSize: "17px", fontWeight: 600, color: text },
    emptySub:    { margin: "6px 0 0", fontSize: "13px", color: sub },
    list:        { display: "flex", flexDirection: "column", gap: "12px" },
    card:        { position: "relative", background: cardBg, borderRadius: "12px", padding: "18px 20px", border: `1px solid ${border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "box-shadow 0.15s" },
    cardUnread:  { background: unreadBg, boxShadow: "0 2px 8px rgba(99,102,241,0.1)" },
    cardTop:     { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "8px" },
    emoji:       { fontSize: "22px", lineHeight: 1.2, flexShrink: 0 },
    cardTitle:   { fontSize: "15px", fontWeight: 600, color: text },
    orderId:     { fontSize: "12px", color: sub, marginTop: "2px", fontFamily: "monospace" },
    time:        { fontSize: "11px", color: sub, whiteSpace: "nowrap", marginLeft: "auto", paddingLeft: "8px" },
    body:        { margin: "0 0 12px", fontSize: "13px", color: sub, lineHeight: 1.6, paddingLeft: "34px" },
    cardFooter:  { display: "flex", alignItems: "center", gap: "10px", paddingLeft: "34px" },
    badge:       { padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600 },
    markReadBtn: { padding: "4px 12px", borderRadius: "8px", border: "1px solid #6366f1", background: "transparent", color: "#6366f1", fontSize: "12px", fontWeight: 500, cursor: "pointer" },
  };
};

export default UserMessages;
