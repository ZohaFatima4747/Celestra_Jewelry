import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CONTACT_URL } from "../utils/api";
import "./ContactUs.css";

const INITIAL = { name: "", email: "", subject: "", message: "" };

const ContactUs = () => {
  const [form, setForm]       = useState(INITIAL);
  const [errors, setErrors]   = useState({});
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required.";
    if (!form.email.trim())   e.email   = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.message.trim()) e.message = "Message is required.";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setStatus(null);
    try {
      const res  = await fetch(CONTACT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", text: data.message || "Message sent successfully." });
        setForm(INITIAL);
        setErrors({});
      } else {
        setStatus({ type: "error", text: data.error || "Something went wrong." });
      }
    } catch {
      setStatus({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us – Celestra Jewelry</title>
        <meta name="description" content="Get in touch with Celestra Jewelry. We'd love to hear from you." />
      </Helmet>

      <div className="cu-page">
        <div className="cu-card">
          <button className="cu-back-btn" onClick={() => navigate("/")} aria-label="Back to shop">
            ← Back to Shop
          </button>
          <h1 className="cu-title">Contact Us</h1>
          <p className="cu-subtitle">Have a question or a special request? We'd love to hear from you.</p>

          {status && (
            <div className={`cu-alert cu-alert--${status.type}`} role="alert">
              {status.text}
            </div>
          )}

          <form className="cu-form" onSubmit={handleSubmit} noValidate>
            <div className="cu-field">
              <label htmlFor="cu-name">Name <span aria-hidden="true">*</span></label>
              <input
                id="cu-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                aria-required="true"
                aria-describedby={errors.name ? "cu-name-err" : undefined}
                className={errors.name ? "cu-input--error" : ""}
              />
              {errors.name && <span id="cu-name-err" className="cu-error">{errors.name}</span>}
            </div>

            <div className="cu-field">
              <label htmlFor="cu-email">Email <span aria-hidden="true">*</span></label>
              <input
                id="cu-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                aria-required="true"
                aria-describedby={errors.email ? "cu-email-err" : undefined}
                className={errors.email ? "cu-input--error" : ""}
              />
              {errors.email && <span id="cu-email-err" className="cu-error">{errors.email}</span>}
            </div>

            <div className="cu-field">
              <label htmlFor="cu-subject">Subject <span className="cu-optional">(optional)</span></label>
              <input
                id="cu-subject"
                name="subject"
                type="text"
                placeholder="What's this about?"
                value={form.subject}
                onChange={handleChange}
              />
            </div>

            <div className="cu-field">
              <label htmlFor="cu-message">Message <span aria-hidden="true">*</span></label>
              <textarea
                id="cu-message"
                name="message"
                rows={5}
                placeholder="Write your message here..."
                value={form.message}
                onChange={handleChange}
                aria-required="true"
                aria-describedby={errors.message ? "cu-message-err" : undefined}
                className={errors.message ? "cu-input--error" : ""}
              />
              {errors.message && <span id="cu-message-err" className="cu-error">{errors.message}</span>}
            </div>

            <button type="submit" className="cu-btn" disabled={loading}>
              {loading ? "Sending…" : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ContactUs;
