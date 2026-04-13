import React, { useEffect, useState } from "react";
import { ORDER_URL } from "../utils/api";
import { getUserId, getUserEmail } from "../utils/auth";
import "./MyOrders.css";

const STATUS_CONFIG = {
  delivered: {
    label: "Delivered",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
    icon: "✓",
  },
  "pending COD": {
    label: "Pending COD",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    icon: "⏳",
  },
  shipped: {
    label: "Shipped",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.25)",
    icon: "🚚",
  },
  cancelled: {
    label: "Cancelled",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
    icon: "✕",
  },
};

const MyOrders = ({ isDark }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      return;
    }
    const email = getUserEmail();
    const url = email
      ? `${ORDER_URL}/user/${userId}?email=${encodeURIComponent(email)}`
      : `${ORDER_URL}/user/${userId}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(orderId);
    try {
      const res = await fetch(
        `${ORDER_URL}/${orderId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        },
      );
      const data = await res.json();
      if (data.success)
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: "cancelled" } : o,
          ),
        );
      else alert(data.error);
    } catch {
      alert("Error cancelling order");
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatus = (s) =>
    STATUS_CONFIG[s] || {
      label: s,
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.1)",
      border: "rgba(148,163,184,0.2)",
      icon: "•",
    };

  const filtered =
    filter === "all"
      ? orders
      : orders.filter((o) => o.status === filter);

  if (loading)
    return (
      <div className="mo-loading">
        <div className="mo-spinner" />
        <p>Loading orders...</p>
      </div>
    );

  return (
    <div className={`mo-wrap ${isDark ? "dark" : "light"}`}>
      {/* Summary Strip */}
      <div className="mo-summary">
        <div className="mo-stat">
          <strong>{orders.length}</strong>
          <span>Total</span>
        </div>
        <div className="mo-stat">
          <strong style={{ color: "#22c55e" }}>
            {orders.filter((o) => o.status === "delivered").length}
          </strong>
          <span>Delivered</span>
        </div>
        <div className="mo-stat">
          <strong style={{ color: "#3b82f6" }}>
            {orders.filter((o) => o.status === "shipped").length}
          </strong>
          <span>Shipped</span>
        </div>
        <div className="mo-stat">
          <strong style={{ color: "#f59e0b" }}>
            {orders.filter((o) => o.status === "pending COD").length}
          </strong>
          <span>Pending</span>
        </div>
        <div className="mo-stat">
          <strong style={{ color: "#ef4444" }}>
            {orders.filter((o) => o.status === "cancelled").length}
          </strong>
          <span>Cancelled</span>
        </div>
        <div className="mo-stat">
          <strong style={{ color: "#a78bfa" }}>
            Rs{" "}
            {orders
              .filter((o) => o.status === "delivered")
              .reduce((s, o) => s + o.total, 0)
              .toLocaleString()}
          </strong>
          <span>Spent</span>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="mo-filters">
        {["all", "pending COD", "shipped", "delivered", "cancelled"].map((f) => (
          <button
            key={f}
            className={`mo-filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All Orders" : f === "pending COD" ? "Pending COD" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="mo-empty">
          <span>📭</span>
          <p>
            {filter === "all"
              ? "No orders placed yet."
              : `No ${filter} orders.`}
          </p>
        </div>
      ) : (
        <div className="mo-list">
          {filtered.map((order, i) => {
            const st = getStatus(order.status);
            const isOpen = expanded === order._id;
            return (
              <div
                className={`mo-card ${isOpen ? "open" : ""}`}
                key={order._id}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Row */}
                <div
                  className="mo-row"
                  onClick={() => setExpanded(isOpen ? null : order._id)}
                >
                  <div className="mo-row-left">
                    <div className="mo-icon">🛍️</div>
                    <div>
                      <div className="mo-id">
                        #{order._id.slice(-8).toUpperCase()}
                      </div>
                      <div className="mo-date">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mo-row-mid">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <span className="mo-chip" key={idx}>
                        {item.name.replace("Grace ", "")} ×{item.qty}
                      </span>
                    ))}
                    {order.items.length > 2 && (
                      <span className="mo-chip more">
                        +{order.items.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="mo-row-right">
                    <span
                      className="mo-badge"
                      style={{
                        color: st.color,
                        background: st.bg,
                        border: `1px solid ${st.border}`,
                      }}
                    >
                      {st.icon} {st.label}
                    </span>
                    <span className="mo-total">
                      Rs {order.total.toLocaleString()}
                    </span>
                    <span className="mo-chevron">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div className="mo-detail">
                    <div className="mo-detail-grid">
                      {/* Items */}
                      <div className="mo-section">
                        <h4>Items Ordered</h4>
                        {order.items.map((item, idx) => (
                          <div className="mo-item" key={idx}>
                            <span className="mo-item-name">{item.name}</span>
                            <span className="mo-item-qty">×{item.qty}</span>
                            <span className="mo-item-price">
                              Rs {(item.price * item.qty).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        <div className="mo-item total-row">
                          <span>Total</span>
                          <span></span>
                          <span className="mo-grand-total">
                            Rs {order.total.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Delivery */}
                      <div className="mo-section">
                        <h4>Delivery Details</h4>
                        <div className="mo-info">
                          <span>👤</span>
                          <span>{order.customer?.name}</span>
                        </div>
                        <div className="mo-info">
                          <span>📧</span>
                          <span>{order.customer?.email}</span>
                        </div>
                        <div className="mo-info">
                          <span>📞</span>
                          <span>{order.customer?.phone || '—'}</span>
                        </div>
                        {(order.customer?.city || order.customer?.province) && (
                          <div className="mo-info">
                            <span>🏙️</span>
                            <span>
                              {[order.customer?.city, order.customer?.province].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        <div className="mo-info">
                          <span>📍</span>
                          <span>{order.customer?.address || '—'}</span>
                        </div>
                        <div className="mo-info">
                          <span>💳</span>
                          <span>Cash on Delivery</span>
                        </div>
                      </div>
                    </div>

                    {/* Cancel */}
                    {order.status === "pending COD" && (
                      <div className="mo-actions">
                        <button
                          className="mo-cancel-btn"
                          onClick={() => handleCancel(order._id)}
                          disabled={cancelling === order._id}
                        >
                          {cancelling === order._id
                            ? "Cancelling..."
                            : "🗑 Cancel Order"}
                        </button>
                      </div>
                    )}
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

export default MyOrders;
