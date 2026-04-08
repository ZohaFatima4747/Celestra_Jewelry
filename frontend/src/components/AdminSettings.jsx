import React, { useEffect, useState } from "react";
import { AUTH_URL } from "../utils/api";

const AdminSettings = ({ theme: propTheme, onThemeChange }) => {
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [theme, setTheme] = useState(
    propTheme || localStorage.getItem("theme") || "light",
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("account");

  const token = localStorage.getItem("token");
  const userId = (() => {
    try {
      return JSON.parse(atob(token.split(".")[1])).id;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (propTheme) setTheme(propTheme);
  }, [propTheme]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `${AUTH_URL}/user/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUserData({ name: data.name, email: data.email });
      } catch (err) {
        setMessage("error:Error fetching user data!");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId, token]);

  const handleUpdate = async () => {
    if (!token) return setMessage("error:Login first!");
    setUpdating(true);
    setMessage("");
    try {
      const updateData = { name: userData.name, email: userData.email };
      if (password) updateData.password = password;
      const res = await fetch(
        `${AUTH_URL}/user/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        },
      );
      if (!res.ok) throw new Error("Update failed");
      setMessage("success:Account updated successfully!");
      setPassword("");
    } catch (err) {
      setMessage("error:Error updating account!");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    if (!token) return setMessage("error:Login first!");
    try {
      const res = await fetch(
        `${AUTH_URL}/user/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Delete failed");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/";
    } catch (err) {
      setMessage("error:Error deleting account!");
    }
  };

  const isDark = theme === "dark";

  const styles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Georgia', serif",
      padding: "40px 20px",
      transition: "all 0.4s ease",
    },
    card: {
      width: "100%",
      maxWidth: "520px",
      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.75)",
      backdropFilter: "blur(20px)",
      borderRadius: "24px",
      border: isDark
        ? "1px solid rgba(255,255,255,0.1)"
        : "1px solid rgba(0,0,0,0.08)",
      boxShadow: isDark
        ? "0 25px 60px rgba(0,0,0,0.5)"
        : "0 25px 60px rgba(0,0,0,0.12)",
      overflow: "hidden",
    },
    header: {
      padding: "36px 40px 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: "28px",
      fontWeight: "700",
      color: isDark ? "#f0ece8" : "#1a1410",
      margin: 0,
      letterSpacing: "-0.5px",
    },
    subtitle: {
      fontSize: "13px",
      color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
      margin: "4px 0 0",
      fontStyle: "italic",
    },
    avatar: {
      width: "52px",
      height: "52px",
      borderRadius: "50%",
      background: isDark
        ? "linear-gradient(135deg, #667eea, #764ba2)"
        : "linear-gradient(135deg, #c9a96e, #8b6914)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "20px",
      fontWeight: "700",
      color: "#fff",
      boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    },
    tabs: {
      display: "flex",
      padding: "24px 40px 0",
      gap: "4px",
      borderBottom: isDark
        ? "1px solid rgba(255,255,255,0.08)"
        : "1px solid rgba(0,0,0,0.06)",
    },
    tab: (active) => ({
      padding: "10px 20px",
      borderRadius: "10px 10px 0 0",
      border: "none",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: active ? "600" : "400",
      fontFamily: "'Georgia', serif",
      background: active
        ? isDark
          ? "rgba(255,255,255,0.1)"
          : "rgba(0,0,0,0.06)"
        : "transparent",
      color: active
        ? isDark
          ? "#f0ece8"
          : "#1a1410"
        : isDark
          ? "rgba(255,255,255,0.4)"
          : "rgba(0,0,0,0.4)",
      transition: "all 0.2s ease",
      borderBottom: active
        ? `2px solid ${isDark ? "#c9a96e" : "#8b6914"}`
        : "2px solid transparent",
    }),
    body: { padding: "32px 40px 40px" },
    messageBox: (type) => ({
      padding: "12px 16px",
      borderRadius: "10px",
      fontSize: "13px",
      marginBottom: "24px",
      background:
        type === "success"
          ? isDark
            ? "rgba(72,199,142,0.15)"
            : "rgba(72,199,142,0.1)"
          : isDark
            ? "rgba(255,99,99,0.15)"
            : "rgba(255,99,99,0.1)",
      color: type === "success" ? "#48c78e" : "#ff6363",
      border: `1px solid ${type === "success" ? "rgba(72,199,142,0.3)" : "rgba(255,99,99,0.3)"}`,
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }),
    field: { marginBottom: "20px" },
    label: {
      display: "block",
      fontSize: "11px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "1px",
      color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
      marginBottom: "8px",
    },
    input: {
      width: "100%",
      padding: "13px 16px",
      borderRadius: "12px",
      border: isDark
        ? "1px solid rgba(255,255,255,0.1)"
        : "1px solid rgba(0,0,0,0.1)",
      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
      color: isDark ? "#f0ece8" : "#1a1410",
      fontSize: "15px",
      fontFamily: "'Georgia', serif",
      outline: "none",
      transition: "all 0.2s ease",
      boxSizing: "border-box",
    },
    btnPrimary: {
      width: "100%",
      padding: "14px",
      borderRadius: "12px",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "600",
      fontFamily: "'Georgia', serif",
      background: isDark
        ? "linear-gradient(135deg, #c9a96e, #8b6914)"
        : "linear-gradient(135deg, #8b6914, #c9a96e)",
      color: "#fff",
      marginTop: "8px",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 15px rgba(139,105,20,0.3)",
      letterSpacing: "0.3px",
    },
    dangerZone: {
      marginTop: "8px",
      padding: "20px",
      borderRadius: "14px",
      border: "1px solid rgba(255,99,99,0.2)",
      background: isDark ? "rgba(255,99,99,0.05)" : "rgba(255,99,99,0.03)",
    },
    dangerTitle: {
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "1px",
      color: "#ff6363",
      marginBottom: "12px",
    },
    btnDanger: {
      padding: "11px 20px",
      borderRadius: "10px",
      border: "1px solid rgba(255,99,99,0.4)",
      cursor: "pointer",
      fontSize: "13px",
      fontFamily: "'Georgia', serif",
      background: "transparent",
      color: "#ff6363",
      transition: "all 0.2s ease",
      marginRight: "10px",
    },
    btnLogout: {
      padding: "11px 20px",
      borderRadius: "10px",
      border: isDark
        ? "1px solid rgba(255,255,255,0.15)"
        : "1px solid rgba(0,0,0,0.12)",
      cursor: "pointer",
      fontSize: "13px",
      fontFamily: "'Georgia', serif",
      background: "transparent",
      color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
      transition: "all 0.2s ease",
    },
    modal: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px",
    },
    modalCard: {
      background: isDark ? "#1a1a2e" : "#fff",
      borderRadius: "20px",
      padding: "36px",
      maxWidth: "380px",
      width: "100%",
      border: isDark
        ? "1px solid rgba(255,255,255,0.1)"
        : "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 30px 80px rgba(0,0,0,0.3)",
    },
    modalIcon: { fontSize: "40px", textAlign: "center", marginBottom: "16px" },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "700",
      color: isDark ? "#f0ece8" : "#1a1410",
      textAlign: "center",
      marginBottom: "8px",
    },
    modalText: {
      fontSize: "13px",
      color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
      textAlign: "center",
      marginBottom: "28px",
      lineHeight: "1.6",
    },
    modalBtns: { display: "flex", gap: "12px" },
    btnCancel: {
      flex: 1,
      padding: "13px",
      borderRadius: "12px",
      border: isDark
        ? "1px solid rgba(255,255,255,0.15)"
        : "1px solid rgba(0,0,0,0.12)",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "'Georgia', serif",
      background: "transparent",
      color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
    },
    btnConfirmDelete: {
      flex: 1,
      padding: "13px",
      borderRadius: "12px",
      border: "none",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "'Georgia', serif",
      background: "linear-gradient(135deg, #ff6363, #cc0000)",
      color: "#fff",
      fontWeight: "600",
      boxShadow: "0 4px 15px rgba(255,99,99,0.3)",
    },
  };

  const getInitial = () =>
    userData.name ? userData.name[0].toUpperCase() : "U";
  const msgType = message.startsWith("success:") ? "success" : "error";
  const msgText = message.replace(/^(success:|error:)/, "");

  if (loading) {
    return (
      <div style={styles.page}>
        <div
          style={{ textAlign: "center", color: isDark ? "#f0ece8" : "#1a1410" }}
        >
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚙️</div>
          <p style={{ fontFamily: "'Georgia', serif", opacity: 0.6 }}>
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Settings</h1>
            <p style={styles.subtitle}>Manage your account preferences</p>
          </div>
          <div style={styles.avatar}>{getInitial()}</div>
        </div>

        {/* Tabs — sirf 2 */}
        <div style={styles.tabs}>
          <button
            style={styles.tab(activeTab === "account")}
            onClick={() => setActiveTab("account")}
          >
            Account
          </button>
          <button
            style={styles.tab(activeTab === "danger")}
            onClick={() => setActiveTab("danger")}
          >
            Danger Zone
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {message && (
            <div style={styles.messageBox(msgType)}>
              <span>{msgType === "success" ? "✅" : "❌"}</span>
              <span>{msgText}</span>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div>
              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input
                  style={styles.input}
                  type="text"
                  value={userData.name}
                  onChange={(e) =>
                    setUserData({ ...userData, name: e.target.value })
                  }
                  placeholder="Your name"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email Address</label>
                <input
                  style={styles.input}
                  type="email"
                  value={userData.email}
                  onChange={(e) =>
                    setUserData({ ...userData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>New Password</label>
                <input
                  style={styles.input}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </div>
              <button
                style={{ ...styles.btnPrimary, opacity: updating ? 0.7 : 1 }}
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? "Saving changes..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === "danger" && (
            <div>
              <div style={styles.dangerZone}>
                <div style={styles.dangerTitle}>⚠ Danger Zone</div>
                <p
                  style={{
                    fontSize: "13px",
                    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
                    marginBottom: "16px",
                    lineHeight: "1.6",
                  }}
                >
                  These actions are permanent and cannot be undone. Please
                  proceed with caution.
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button style={styles.btnLogout} onClick={handleLogout}>
                    🚪 Logout
                  </button>
                  <button
                    style={styles.btnDanger}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    🗑 Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <div style={styles.modalIcon}>🗑️</div>
            <div style={styles.modalTitle}>Delete Account?</div>
            <div style={styles.modalText}>
              This will permanently delete your account and all associated data.
              This action cannot be undone.
            </div>
            <div style={styles.modalBtns}>
              <button
                style={styles.btnCancel}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                style={styles.btnConfirmDelete}
                onClick={handleDeleteAccount}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
