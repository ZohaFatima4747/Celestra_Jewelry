import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerDashboard.css";
import { API, AUTH_URL as AUTH_API } from "../utils/api";

const API_ADMIN = `${API}/admin`;

const STATUS_CONFIG = {
  completed:     { label: "Completed",   color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)" },
  "pending COD": { label: "Pending COD", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)" },
  pending:       { label: "Pending",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)" },
  shipped:       { label: "Shipped",     color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)" },
  delivered:     { label: "Delivered",   color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)" },
  cancelled:     { label: "Cancelled",   color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)" },
};

const getToken = () => localStorage.getItem("token");
const getDecoded = () => {
  const token = getToken();
  if (!token) return null;
  try { return JSON.parse(atob(token.split(".")[1])); }
  catch { return null; }
};

// ── PROFILE MODAL ─────────────────────────────────
const ProfileModal = ({ onClose, onUpdate }) => {
  const decoded = getDecoded();
  const userId  = decoded?.id;

  const [form, setForm]         = useState({ name: "", email: "", password: "", confirm: "" });
  const [original, setOriginal] = useState({ name: "", email: "" });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ text: "", type: "" });

  useEffect(() => {
    if (!userId) return;
    fetch(`${AUTH_API}/user/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => {
        setForm(f => ({ ...f, name: data.name || "", email: data.email || "" }));
        setOriginal({ name: data.name || "", email: data.email || "" });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const handleSave = async () => {
    if (form.password && form.password !== form.confirm) {
      showMsg("Passwords do not match!", "error"); return;
    }
    if (form.password && form.password.length < 6) {
      showMsg("Password must be at least 6 characters!", "error"); return;
    }

    setSaving(true);
    try {
      const body = { name: form.name, email: form.email };
      if (form.password) body.password = form.password;

      const res = await fetch(`${AUTH_API}/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setOriginal({ name: form.name, email: form.email });
        setForm(f => ({ ...f, password: "", confirm: "" }));
        onUpdate(form.name); // ← chip update karo
        showMsg("Profile updated successfully!");
      } else {
        showMsg(data.message || "Update failed!", "error");
      }
    } catch {
      showMsg("Server error!", "error");
    }
    setSaving(false);
  };

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>
        <div className="pm-header">
          <div className="pm-avatar">
            {original.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div>
            <h3 className="pm-title">Owner Profile</h3>
            <p className="pm-sub">{original.email}</p>
          </div>
          <button className="pm-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="od-loading"><div className="od-spinner"/><p>Loading...</p></div>
        ) : (
          <div className="pm-body">
            {msg.text && <div className={`pm-msg ${msg.type}`}>{msg.text}</div>}

            <div className="pm-section-label">Account Info</div>

            <div className="pm-field">
              <label>Full Name</label>
              <input type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your name" />
            </div>

            <div className="pm-field">
              <label>Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Your email" />
            </div>

            <div className="pm-section-label" style={{ marginTop: "20px" }}>Change Password</div>
            <p className="pm-hint">Leave blank to keep current password</p>

            <div className="pm-field">
              <label>New Password</label>
              <input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="New password" />
            </div>

            <div className="pm-field">
              <label>Confirm Password</label>
              <input type="password" value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Confirm new password" />
            </div>

            <button className="pm-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── STATS SECTION ─────────────────────────────────
const StatsSection = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_ADMIN}/stats`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="od-loading"><div className="od-spinner"/><p>Loading stats...</p></div>;
  if (!stats) return <p className="od-err">Failed to load stats</p>;

  const maxRev = Math.max(...stats.last7.map(d => d.revenue), 1);

  return (
    <div className="od-stats-wrap">
      <div className="od-cards">
        {[
          { icon: "💰", label: "Total Revenue",  value: `Rs ${stats.totalRevenue.toLocaleString()}`, color: "#22c55e" },
          { icon: "📦", label: "Total Orders",   value: stats.totalOrders,    color: "#3b82f6" },
          { icon: "⏳", label: "Pending Orders", value: stats.pendingOrders,  color: "#f59e0b" },
          { icon: "👥", label: "Total Users",    value: stats.totalUsers,     color: "#a78bfa" },
        ].map((c, i) => (
          <div className="od-card" key={i}>
            <div className="od-card-icon" style={{ background: `${c.color}18` }}>{c.icon}</div>
            <div className="od-card-val" style={{ color: c.color }}>{c.value}</div>
            <div className="od-card-lbl">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="od-chart-box">
        <div className="od-chart-header">
          <h3>Revenue — Last 7 Days</h3>
          <span className="od-chart-total">Rs {stats.totalRevenue.toLocaleString()}</span>
        </div>
        <div className="od-chart">
          {stats.last7.map((d, i) => (
            <div className="od-bar-col" key={i}>
              <span className="od-bar-val">
                {d.revenue > 0 ? `Rs ${(d.revenue/1000).toFixed(1)}k` : ""}
              </span>
              <div className="od-bar" style={{ height: `${Math.max((d.revenue / maxRev) * 160, d.revenue > 0 ? 8 : 2)}px` }} />
              <span className="od-bar-day">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="od-breakdown">
        {[
          { label: "Completed", val: stats.completedOrders, color: "#22c55e" },
          { label: "Pending",   val: stats.pendingOrders,   color: "#f59e0b" },
          { label: "Cancelled", val: stats.cancelledOrders, color: "#ef4444" },
        ].map((b, i) => (
          <div className="od-bcard" key={i}>
            <span className="od-bcard-val" style={{ color: b.color }}>{b.val}</span>
            <span className="od-bcard-lbl">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── ORDERS SECTION ────────────────────────────────
const OrdersSection = () => {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter]     = useState("all");
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetch(`${API_ADMIN}/orders`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`${API_ADMIN}/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success)
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    } catch (err) { console.error(err); }
    setUpdating(null);
  };

  const filtered = filter === "all" ? orders : orders.filter(o =>
    filter === "pending" ? (o.status === "pending" || o.status === "pending COD") : o.status === filter
  );

  const formatDate = d => new Date(d).toLocaleDateString("en-PK", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const getStatus = s => STATUS_CONFIG[s] || { label: s, color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" };

  if (loading) return <div className="od-loading"><div className="od-spinner"/><p>Loading orders...</p></div>;

  return (
    <div className="od-orders-wrap">
      <div className="od-section-top">
        <div>
          <h3 className="od-section-title">All Orders</h3>
          <p className="od-section-sub">{orders.length} total orders</p>
        </div>
        <div className="od-filters">
          {["all","completed","pending","shipped","delivered","cancelled"].map(f => (
            <button key={f} className={`od-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="od-empty"><span>📭</span><p>No orders found</p></div>
      ) : (
        <div className="od-order-list">
          {filtered.map((order, i) => {
            const st = getStatus(order.status);
            const isOpen = expanded === order._id;
            return (
              <div className={`od-order-card ${isOpen ? "open" : ""}`} key={order._id} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="od-order-row" onClick={() => setExpanded(isOpen ? null : order._id)}>
                  <div className="od-order-left">
                    <div className="od-order-icon">🛍️</div>
                    <div>
                      <div className="od-order-id">#{order._id.slice(-8).toUpperCase()}</div>
                      <div className="od-order-date">{formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                  <div className="od-order-customer">
                    <span className="od-customer-name">{order.customer?.name}</span>
                    <span className="od-customer-email">{order.customer?.email}</span>
                  </div>
                  <div className="od-order-right">
                    <span className="od-status-badge" style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                      {st.label}
                    </span>
                    <span className="od-order-total">Rs {order.total.toLocaleString()}</span>
                    <span className="od-chevron">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="od-order-detail">
                    <div className="od-detail-grid">
                      <div className="od-detail-section">
                        <h4>Items</h4>
                        {order.items.map((item, idx) => (
                          <div className="od-detail-item" key={idx}>
                            <span>{item.name}</span>
                            <span className="od-item-qty">×{item.qty}</span>
                            <span className="od-item-price">Rs {(item.price * item.qty).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="od-detail-total">
                          <span>Total</span>
                          <span style={{ color: "#22c55e" }}>Rs {order.total.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="od-detail-section">
                        <h4>Customer</h4>
                        <div className="od-cinfo"><span>👤</span><span>{order.customer?.name}</span></div>
                        <div className="od-cinfo"><span>📧</span><span>{order.customer?.email}</span></div>
                        <div className="od-cinfo"><span>📞</span><span>{order.customer?.phone}</span></div>
                        <div className="od-cinfo"><span>📍</span><span>{order.customer?.address}</span></div>
                        <div className="od-cinfo">
                          <span>💳</span>
                          <span>Cash on Delivery</span>
                        </div>
                      </div>
                    </div>
                    <div className="od-status-update">
                      <span className="od-status-lbl">Update Status:</span>
                      <div className="od-status-btns">
                        {["pending COD","shipped","delivered","completed","cancelled"].map(s => (
                          <button key={s}
                            className={`od-status-btn ${order.status === s ? "current" : ""}`}
                            style={order.status === s ? { background: getStatus(s).bg, color: getStatus(s).color, borderColor: getStatus(s).border } : {}}
                            onClick={() => updateStatus(order._id, s)}
                            disabled={updating === order._id || order.status === s}
                          >
                            {updating === order._id ? "..." : s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── USERS SECTION ─────────────────────────────────
const UsersSection = () => {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetch(`${API_ADMIN}/users`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;
    setDeleting(userId);
    try {
      await fetch(`${API_ADMIN}/users/${userId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
      });
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) { console.error(err); }
    setDeleting(null);
  };

  if (loading) return <div className="od-loading"><div className="od-spinner"/><p>Loading users...</p></div>;

  return (
    <div className="od-users-wrap">
      <div className="od-section-top">
        <div>
          <h3 className="od-section-title">All Users</h3>
          <p className="od-section-sub">{users.length} registered users</p>
        </div>
      </div>
      {users.length === 0 ? (
        <div className="od-empty"><span>👥</span><p>No users found</p></div>
      ) : (
        <div className="od-user-list">
          {users.map((user, i) => (
            <div className="od-user-row" key={user._id} style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="od-user-avatar">{user.name?.charAt(0).toUpperCase() || "U"}</div>
              <div className="od-user-info">
                <span className="od-user-name">{user.name}</span>
                <span className="od-user-email">{user.email}</span>
              </div>
              <div className="od-user-role">
                <span className="od-role-badge">{user.role}</span>
              </div>
              <button className="od-user-del-btn" onClick={() => deleteUser(user._id)} disabled={deleting === user._id}>
                {deleting === user._id ? "..." : "🗑"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── MAIN DASHBOARD ────────────────────────────────
const OwnerDashboard = () => {
  const [activeTab, setActiveTab]     = useState("stats");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // ← local state — chip update ke liye
  const [adminName, setAdminName] = useState(() => {
    const d = getDecoded();
    return d?.email?.split("@")[0] || "Admin";
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate("/"); return; }
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      if (decoded.role !== "admin") navigate("/shop");
    } catch { navigate("/"); }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("refreshToken");
    navigate("/");
  };

  const TAB_TITLES = {
    stats:  { title: "Dashboard", sub: "Overview of your store" },
    orders: { title: "Orders",    sub: "Manage and update all orders" },
    users:  { title: "Users",     sub: "Registered customers" },
  };

  return (
    <div className="od-layout">
      {sidebarOpen && <div className="od-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* PROFILE MODAL */}
      {profileOpen && (
        <ProfileModal
          onClose={() => setProfileOpen(false)}
          onUpdate={(name) => setAdminName(name)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`od-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="od-sb-logo">
          <span className="od-sb-icon">⚡</span>
          <span className="od-sb-brand">Grace</span>
          <span className="od-sb-badge">Owner</span>
        </div>

        <p className="od-sb-section">Dashboard</p>
        <nav className="od-sb-nav">
          {[
            { key: "stats",  icon: "📊", label: "Overview" },
            { key: "orders", icon: "📦", label: "Orders" },
            { key: "users",  icon: "👥", label: "Users" },
          ].map(item => (
            <button key={item.key}
              className={`od-sb-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
            >
              <span className="od-sb-item-icon">{item.icon}</span>
              <span className="od-sb-item-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="od-sb-bottom">
          <button className="od-sb-back" onClick={handleLogout}>⎋ Logout</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="od-main">
        <div className="od-topbar">
          <div className="od-topbar-left">
            <button className="od-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <h1 className="od-page-title">{TAB_TITLES[activeTab].title}</h1>
              <p className="od-page-sub">{TAB_TITLES[activeTab].sub}</p>
            </div>
          </div>

          {/* Profile chip */}
          <div className="od-user-chip" onClick={() => setProfileOpen(true)} title="Edit Profile">
            <div className="od-avatar">
              {adminName?.charAt(0).toUpperCase()}
            </div>
            <span className="od-user-name">{adminName}</span>
            <span className="od-chip-edit">✏️</span>
          </div>
        </div>

        <div className="od-content">
          {activeTab === "stats"  && <StatsSection />}
          {activeTab === "orders" && <OrdersSection />}
          {activeTab === "users"  && <UsersSection />}
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboard;
