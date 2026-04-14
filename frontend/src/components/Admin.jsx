import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserCart from "./UserCart";
import UserWishlist from "./UserWishlist";
import AdminSettings from "./AdminSettings";
import MyOrders from "./MyOrders";
import UserMessages from "./UserMessages";
import SEO from "./SEO";
import { getUserId } from "../utils/auth";
import { MSG_URL } from "../utils/api";
import api from "../utils/axiosInstance";
import "./Admin.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("myorders");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const isDark = theme === "dark";

  // Redirect to shop if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const fetchUnread = async () => {
      const userId = getUserId();
      if (!userId) return;
      const email = (() => {
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const e = JSON.parse(atob(token.split(".")[1]))?.email;
            if (e) return e;
          }
          return localStorage.getItem("guestEmail") || null;
        } catch { return localStorage.getItem("guestEmail") || null; }
      })();
      const emailParam = email ? `?email=${encodeURIComponent(email)}` : "";
      try {
        const res = await api.get(`${MSG_URL}/user/${userId}${emailParam}`);
        const data = res.data;
        setUnreadCount(Array.isArray(data) ? data.filter((m) => !m.isRead).length : 0);
      } catch { /* silent */ }
    };
    fetchUnread();
  }, [activeTab]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const getUserName = () => {
    const token = localStorage.getItem("token");
    if (!token) return "User";
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      return decoded.name || decoded.email?.split("@")[0] || "User";
    } catch {
      return "User";
    }
  };

  const TAB_TITLES = {
    myorders: { title: "My Orders", subtitle: "Track and manage your orders" },
    messages: {
      title: "Messages",
      subtitle: "Order notifications and updates",
    },
    cart: { title: "My Cart", subtitle: "View and manage your cart items" },
    wishlist: { title: "Wishlist", subtitle: "Products you've saved" },
    settings: {
      title: "Settings",
      subtitle: "Manage your account preferences",
    },
  };

  return (
    <div className={`ad-layout ${isDark ? "dark" : "light"}`}>
      <SEO title="My Account" noIndex={true} />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="ad-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`ad-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="ad-sb-logo">
          <span className="ad-sb-icon">💎</span>
          <span className="ad-sb-brand">Celestra</span>
          <span className="ad-sb-badge">Panel</span>
        </div>

        <p className="ad-sb-section">Menu</p>
        <nav className="ad-sb-nav">
          {[
            { key: "myorders", icon: "🧾", label: "My Orders" },

            { key: "cart", icon: "🛒", label: "User Cart" },
            { key: "wishlist", icon: "❤️", label: "Wishlist" },
            {
              key: "messages",
              icon: "💬",
              label: "Messages",
              badge: unreadCount,
            },
          ].map((item) => (
            <button
              key={item.key}
              className={`ad-sb-item ${activeTab === item.key ? "active" : ""}`}
              onClick={() => {
                setActiveTab(item.key);
                setSidebarOpen(false);
              }}
            >
              <span className="ad-sb-item-icon">{item.icon}</span>
              <span className="ad-sb-item-label">{item.label}</span>
              {item.badge > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "20px",
                    padding: "1px 7px",
                    minWidth: "20px",
                    textAlign: "center",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <p className="ad-sb-section">Account</p>
        <nav className="ad-sb-nav">
          <button
            className={`ad-sb-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("settings");
              setSidebarOpen(false);
            }}
          >
            <span className="ad-sb-item-icon">⚙️</span>
            <span className="ad-sb-item-label">Settings</span>
          </button>
        </nav>

        <div className="ad-sb-bottom">
          <button className="ad-sb-back" onClick={() => navigate("/")}>
            ← Back to Shop
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="ad-main">
        {/* Topbar */}
        <div className="ad-topbar">
          <div className="ad-topbar-left">
            <button
              className="ad-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div>
              <h1 className="ad-page-title">{TAB_TITLES[activeTab].title}</h1>
              <p className="ad-page-sub">{TAB_TITLES[activeTab].subtitle}</p>
            </div>
          </div>
          <div className="ad-user-chip">
            <div className="ad-avatar">
              {getUserName().charAt(0).toUpperCase()}
            </div>
            <span className="ad-user-name">{getUserName()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="ad-content">
          {activeTab === "myorders" && <MyOrders isDark={isDark} />}

          {activeTab === "cart" && <UserCart />}
          {activeTab === "wishlist" && <UserWishlist isDark={isDark} />}
          {activeTab === "messages" && <UserMessages isDark={isDark} />}
          {activeTab === "settings" && (
            <AdminSettings theme={theme} onThemeChange={handleThemeChange} />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
