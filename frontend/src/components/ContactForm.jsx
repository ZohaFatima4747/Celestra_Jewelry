import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Form.css";
import logo from "../assets/logo.jpeg";
import { AUTH_URL } from "../utils/api";
import { mergeWishlistOnAuth } from "../utils/wishlist";

const BASE_URL = AUTH_URL;

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE_URL}/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      return data.token;
    }
    return null;
  } catch (err) {
    console.error("Refresh token error:", err);
    return null;
  }
};

const ContactForm = ({ onClose, setCartItems }) => {
  const navigate = useNavigate();

  const [flow, setFlow]               = useState(null);
  const [formData, setFormData]       = useState({ name: "", email: "", password: "" });
  const [responseMsg, setResponseMsg] = useState("");
  const [isError, setIsError]         = useState(false);
  const [adminLogin, setAdminLogin]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("guestEmail") || "";
    const savedName  = localStorage.getItem("guestName")  || "";

    if (savedEmail) {
      setFormData({ name: savedName, email: savedEmail, password: "" });
      fetch(`${BASE_URL}/check-guest?email=${encodeURIComponent(savedEmail)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.isGuest) {
            setFormData({ name: data.name || savedName, email: savedEmail, password: "" });
            setFlow("set-password");
          } else {
            setFlow("signup");
          }
        })
        .catch(() => setFlow("signup"));
    } else {
      setFlow("signup");
    }
  }, []);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEmailBlur = async () => {
    if (flow !== "signup" || adminLogin || !formData.email) return;
    try {
      const res  = await fetch(`${BASE_URL}/check-guest?email=${encodeURIComponent(formData.email)}`);
      const data = await res.json();
      if (data.isGuest) {
        setFlow("set-password");
        if (data.name) setFormData((prev) => ({ ...prev, name: data.name }));
      }
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponseMsg("");
    try {
      const url = (flow === "login" || adminLogin)
        ? `${BASE_URL}/login`
        : `${BASE_URL}/signup`; // handles both signup and set-password (guest → full user)

      const savedCart = localStorage.getItem("guestCart");
      const body = { ...formData, guestCart: savedCart ? JSON.parse(savedCart) : [] };

      const res  = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.removeItem("guestEmail");
        localStorage.removeItem("guestName");
        if (savedCart) localStorage.removeItem("guestCart");

        let role = "user";
        try { role = JSON.parse(atob(data.token.split(".")[1])).role || "user"; } catch {}

        if (savedCart && setCartItems) setCartItems(JSON.parse(savedCart));

        // Merge guest wishlist into user account
        await mergeWishlistOnAuth();

        if (role === "admin") {
          navigate("/owner");
        } else {
          navigate("/admin");
        }
      } else if (data.action === "LOGIN_SUGGEST") {
        setIsError(true);
        setResponseMsg(data.message || "Email already exists.");
        // Switch to login flow with email pre-filled
        setFlow("login");
      } else {
        setIsError(true);
        setResponseMsg(data.message || "Something went wrong.");
        setTimeout(() => setResponseMsg(""), 3500);
      }
    } catch (err) {
      setIsError(true);
      setResponseMsg("Server error: " + err.message);
      setTimeout(() => setResponseMsg(""), 3500);
    } finally {
      setLoading(false);
    }
  };

  const isSetPassword = flow === "set-password" && !adminLogin;
  const isSignUp      = flow === "signup"        && !adminLogin;
  const isLogin       = flow === "login"         || adminLogin;

  const title = isSetPassword ? "Set Your Password"
              : isSignUp      ? "Create Account"
              : "Welcome Back";

  const subtitle = isSetPassword ? "You already have orders — just set a password to activate your account."
                 : isSignUp      ? "Join Celestra to track your orders and save your wishlist."
                 : "Welcome back to Celestra Jewelry.";

  return (
    <div className="cf-card">
      {/* Close button */}
      {typeof onClose === "function" && (
        <button className="cf-close" onClick={onClose} aria-label="Close">✕</button>
      )}

      {/* Header */}
      <div className="cf-header">
        <div className="cf-logo-badge">
          <img src={logo} alt="Celestra" />
        </div>
        <div>
          <h2 className="cf-title">{title}</h2>
          <p className="cf-subtitle">{subtitle}</p>
        </div>
      </div>

      {/* Loading state */}
      {flow === null ? (
        <div className="cf-detecting">
          <div className="cf-spinner" />
          <span>Checking account...</span>
        </div>
      ) : (
        <form className="cf-form" onSubmit={handleSubmit}>
          {(isSignUp || isSetPassword) && (
            <div className="cf-field">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="cf-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              placeholder="you@example.com"
              required
              autoComplete="email"
              readOnly={isSetPassword}
              className={isSetPassword ? "cf-readonly" : ""}
            />
          </div>

          <div className="cf-field">
            <label>Password</label>
            <div className="cf-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isSetPassword ? "Create a password" : "Enter your password"}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="cf-eye-btn"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {responseMsg && (
            <p className={`cf-msg ${isError ? "cf-msg--error" : "cf-msg--success"}`}>
              {responseMsg}
            </p>
          )}

          {/* LOGIN_SUGGEST: show a quick-switch link */}
          {isError && responseMsg && flow === "login" && (
            <p className="cf-toggle" style={{ marginTop: 0 }}>
              <span onClick={() => { setIsError(false); setResponseMsg(""); }}>
                Login with this email →
              </span>
            </p>
          )}

          <button type="submit" className="cf-submit" disabled={loading}>
            {loading ? <span className="cf-btn-spinner" /> : null}
            {loading ? "Please wait..." : isSetPassword ? "Activate Account" : isSignUp ? "Sign Up" : "Login"}
          </button>
        </form>
      )}

      {/* Footer toggles */}
      {flow !== null && !adminLogin && !isSetPassword && (
        <p className="cf-toggle" onClick={() => setFlow(isLogin ? "signup" : "login")}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span>{isLogin ? "Sign Up" : "Login"}</span>
        </p>
      )}

      {isSetPassword && (
        <p
          className="cf-toggle"
          onClick={() => {
            localStorage.removeItem("guestEmail");
            localStorage.removeItem("guestName");
            setFlow("login");
            setFormData({ name: "", email: "", password: "" });
          }}
        >
          Not you? <span>Login with a different account</span>
        </p>
      )}

      {/* Set-password info strip */}
      {isSetPassword && (
        <div className="cf-info-strip">
          🛍 We found your previous orders — they'll appear in your dashboard after activation.
        </div>
      )}
    </div>
  );
};

export default ContactForm;
