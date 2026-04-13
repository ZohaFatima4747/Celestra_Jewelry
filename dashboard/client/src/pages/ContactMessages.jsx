import { useEffect, useState } from 'react';
import api from '../utils/api';
import './ContactMessages.css';

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all'); // 'all' | 'pending' | 'replied'
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending]   = useState(false);
  const [toast, setToast]       = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMessages = async () => {
    try {
      const { data } = await api.get('/contact-us');
      setMessages(data);
    } catch {
      showToast('Failed to load messages.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Mark all as read when page opens, then refresh messages
  useEffect(() => {
    const init = async () => {
      try { await api.post('/contact-us/mark-read'); } catch (_) {}
      await fetchMessages();
    };
    init();
  }, []);

  const filtered = messages.filter((m) => {
    if (filter === 'replied') return m.replied;
    if (filter === 'pending') return !m.replied;
    return true;
  });

  const openReply = (msg) => { setSelected(msg); setReplyText(''); };
  const closeReply = () => { setSelected(null); setReplyText(''); };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post('/contact-us/reply', {
        id:              selected._id,
        name:            selected.name,
        email:           selected.email,
        subject:         selected.subject,
        originalMessage: selected.message,
        replyMessage:    replyText,
      });
      setMessages((prev) =>
        prev.map((m) => m._id === selected._id ? { ...m, replied: true } : m)
      );
      showToast(`Reply sent to ${selected.email}`);
      closeReply();
    } catch {
      showToast('Failed to send reply.', 'error');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/contact-us/${id}`);
      setMessages((prev) => prev.filter((m) => m._id !== id));
      showToast('Message deleted.');
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  const fmt = (iso) => new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const pendingCount = messages.filter((m) => !m.replied).length;
  const repliedCount = messages.filter((m) => m.replied).length;

  return (
    <div className="cm-page">
      <h2 className="page-title">Contact Messages</h2>

      {toast && <div className={`cm-toast cm-toast--${toast.type}`}>{toast.text}</div>}

      {/* Filter tabs */}
      <div className="cm-filters">
        <button className={`cm-filter-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          All <span className="cm-filter-count">{messages.length}</span>
        </button>
        <button className={`cm-filter-btn${filter === 'pending' ? ' active' : ''}`} onClick={() => setFilter('pending')}>
          Pending <span className="cm-filter-count">{pendingCount}</span>
        </button>
        <button className={`cm-filter-btn${filter === 'replied' ? ' active' : ''}`} onClick={() => setFilter('replied')}>
          Replied <span className="cm-filter-count">{repliedCount}</span>
        </button>
      </div>

      {loading ? (
        <p className="cm-empty">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="cm-empty">No {filter !== 'all' ? filter : ''} messages.</p>
      ) : (
        <div className="cm-list">
          {filtered.map((m) => (
            <div key={m._id} className={`cm-card${m.replied ? ' cm-card--replied' : ''}`}>
              <div className="cm-card-header">
                <div className="cm-meta">
                  <span className="cm-name">{m.name}</span>
                  <a href={`mailto:${m.email}`} className="cm-email">{m.email}</a>
                </div>
                <div className="cm-right">
                  <span className="cm-date">{fmt(m.createdAt)}</span>
                  {m.replied
                    ? <span className="cm-badge cm-badge--replied">Replied</span>
                    : <span className="cm-badge cm-badge--pending">Pending</span>
                  }
                </div>
              </div>
              {m.subject && <p className="cm-subject">{m.subject}</p>}
              <p className="cm-message">{m.message}</p>
              <div className="cm-actions">
                <button className="cm-btn cm-btn--reply" onClick={() => openReply(m)}>
                  ↩ Reply
                </button>
                <button className="cm-btn cm-btn--delete" onClick={() => deleteMessage(m._id)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {selected && (
        <div className="cm-overlay" onClick={closeReply}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <div>
                <h3>Reply to {selected.name}</h3>
                <p>{selected.email}</p>
              </div>
              <button className="cm-modal-close" onClick={closeReply}>✕</button>
            </div>
            <div className="cm-original">
              <p className="cm-original-label">Original Message</p>
              {selected.subject && <p className="cm-original-subject">{selected.subject}</p>}
              <p className="cm-original-body">{selected.message}</p>
            </div>
            <textarea
              className="cm-textarea"
              rows={6}
              placeholder="Write your reply here…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="cm-modal-footer">
              <button className="cm-btn cm-btn--cancel" onClick={closeReply}>Cancel</button>
              <button className="cm-btn cm-btn--send" onClick={sendReply} disabled={sending || !replyText.trim()}>
                {sending ? 'Sending…' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
