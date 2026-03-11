import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserCart from "./UserCart";
import UserWishlist from "./UserWishlist";
import AdminSettings from "./AdminSettings";
import MyOrders from "./MyOrders";
import "./Admin.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("myorders");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
    cart: { title: "My Cart", subtitle: "View and manage your cart items" },
    wishlist: { title: "Wishlist", subtitle: "Products you've saved" },
    settings: {
      title: "Settings",
      subtitle: "Manage your account preferences",
    },
  };

  return (
    <div className={`ad-layout ${isDark ? "dark" : "light"}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="ad-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`ad-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="ad-sb-logo">
          <span className="ad-sb-icon">⚡</span>
          <span className="ad-sb-brand">Grace</span>
          <span className="ad-sb-badge">Panel</span>
        </div>

        <p className="ad-sb-section">Menu</p>
        <nav className="ad-sb-nav">
          {[
            { key: "myorders", icon: "🧾", label: "My Orders" },
            { key: "cart", icon: "🛒", label: "User Cart" },
            { key: "wishlist", icon: "❤️", label: "Wishlist" },
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
          <button className="ad-sb-back" onClick={() => navigate("/shop")}>
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
          {activeTab === "settings" && (
            <AdminSettings theme={theme} onThemeChange={handleThemeChange} />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
