import { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';

const TYPE_META = {
  order_placed:    { emoji: '🛒', accent: '#22c55e' },
  order_cancelled: { emoji: '❌', accent: '#ef4444' },
  status_update:   { emoji: '✅', accent: '#3b82f6' },
};

const fmt = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.patch(`/admin/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/admin/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const displayed   = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const s = styles();

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
          <h2 style={s.heading}>Notifications</h2>
          <p style={s.sub}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div style={s.headerRight}>
          <div style={s.filterGroup}>
            {['all', 'unread'].map((f) => (
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
          <div style={s.emptyIcon}>🔔</div>
          <p style={s.emptyText}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p style={s.emptySub}>Order activity will appear here.</p>
        </div>
      )}

      {/* List */}
      <div style={s.list}>
        {displayed.map((n) => {
          const meta = TYPE_META[n.type] || TYPE_META.order_placed;
          return (
            <div
              key={n._id}
              style={{
                ...s.card,
                ...(n.isRead ? {} : s.cardUnread),
                borderLeft: `4px solid ${meta.accent}`,
              }}
            >
              <div style={s.cardTop}>
                <span style={s.emoji}>{meta.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={s.cardTitle}>{n.title}</div>
                  {n.orderId && (
                    <div style={s.orderId}>
                      Order: #{String(n.orderId).slice(-8).toUpperCase()}
                    </div>
                  )}
                </div>
                <span style={s.time}>{fmt(n.createdAt)}</span>
              </div>

              <p style={s.body}>{n.body}</p>

              <div style={s.cardFooter}>
                <span style={{
                  ...s.badge,
                  background: n.isRead ? '#f1f5f9' : meta.accent + '22',
                  color:      n.isRead ? '#94a3b8'  : meta.accent,
                }}>
                  {n.isRead ? 'Read' : 'New'}
                </span>
                {!n.isRead && (
                  <button style={s.markReadBtn} onClick={(e) => markRead(n._id, e)}>
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
}

const styles = () => ({
  wrap:        { maxWidth: '760px' },
  center:      { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '200px', gap: '12px' },
  spinner:     { width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTop: '3px solid #c9a96e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' },
  heading:     { margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 700, color: '#1a1a2e' },
  sub:         { margin: '4px 0 0', fontSize: '13px', color: '#64748b' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' },
  filterBtn:   { padding: '5px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: 'transparent', color: '#64748b' },
  filterActive: { background: '#ffffff', color: '#1a1a2e', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  readAllBtn:  { padding: '6px 14px', border: '1px solid #c9a96e', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#c9a96e', background: 'transparent' },
  empty:       { textAlign: 'center', padding: '60px 20px' },
  emptyIcon:   { fontSize: '48px', marginBottom: '12px' },
  emptyText:   { margin: 0, fontSize: '17px', fontWeight: 600, color: '#1a1a2e' },
  emptySub:    { margin: '6px 0 0', fontSize: '13px', color: '#64748b' },
  list:        { display: 'flex', flexDirection: 'column', gap: '12px' },
  card:        { position: 'relative', background: '#ffffff', borderRadius: '12px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s' },
  cardUnread:  { background: '#f8faff', boxShadow: '0 2px 8px rgba(201,169,110,0.12)' },
  cardTop:     { display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' },
  emoji:       { fontSize: '22px', lineHeight: 1.2, flexShrink: 0 },
  cardTitle:   { fontSize: '15px', fontWeight: 600, color: '#1a1a2e' },
  orderId:     { fontSize: '12px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' },
  time:        { fontSize: '11px', color: '#94a3b8', marginLeft: 'auto', paddingLeft: '8px' },
  body:        { margin: '0 0 12px', fontSize: '13px', color: '#64748b', lineHeight: 1.6, paddingLeft: '34px' },
  cardFooter:  { display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '34px', flexWrap: 'wrap' },
  badge:       { padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 },
  markReadBtn: { padding: '4px 12px', borderRadius: '8px', border: '1px solid #c9a96e', background: 'transparent', color: '#c9a96e', fontSize: '12px', fontWeight: 500, cursor: 'pointer' },
});
