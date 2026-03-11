import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Form.css";

// 🔹 Local backend URL
const BASE_URL = "http://localhost:1000/api/v1/auth";

// 🔹 Refresh Access Token function
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${BASE_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      return data.token;
    }
    return null;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
};

const ContactForm = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [responseMsg, setResponseMsg] = useState("");
  const [adminLogin, setAdminLogin] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url =
        isSignUp && !adminLogin ? `${BASE_URL}/signup` : `${BASE_URL}/login`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResponseMsg(data.message || "Success!");
      setFormData({ name: "", email: "", password: "" });

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        if (data.refreshToken)
          localStorage.setItem("refreshToken", data.refreshToken);

        // Role check — admin ko owner dashboard
        try {
          const decoded = JSON.parse(atob(data.token.split(".")[1]));
          if (decoded.role === "admin") {
            navigate("/owner");
          } else {
            navigate("/shop");
          }
        } catch {
          navigate("/shop");
        }
      }

      setTimeout(() => setResponseMsg(""), 3000);
    } catch (error) {
      setResponseMsg("Server error: " + error.message);
      setTimeout(() => setResponseMsg(""), 3000);
    }
  };

  return (
    <div className="login-container">
      <div className="auth-wrapper">
        {/* ================= FORM BOX ================= */}
        <div className="login-box">
          <h2>{isSignUp && !adminLogin ? "Sign Up" : "Login"}</h2>

          <form onSubmit={handleSubmit}>
            {isSignUp && !adminLogin && (
              <div className="input-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="login-btn">
              {isSignUp && !adminLogin ? "Sign Up" : "Login"}
            </button>
          </form>

          {responseMsg && <p className="response-msg">{responseMsg}</p>}

          {!adminLogin && (
            <p className="toggle-text" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp
                ? "Already have an account? Login"
                : "Don't have an account? Sign Up"}
            </p>
          )}
        </div>

        {/* ================= SIGN UP INSTRUCTIONS ================= */}
        {isSignUp && !adminLogin && (
          <div className="signup-instructions">
            <h3>⚠ Important Instructions</h3>
            <ul>
              <li>🔒 Please make sure to remember your password</li>
              <li>🧠 Use a strong and unique password for better security</li>
              <li>🚫 Do not share your password with anyone</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactForm;
