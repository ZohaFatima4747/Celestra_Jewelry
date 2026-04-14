/**
 * security.js — Centralised rate limiters and input sanitisation helpers.
 * Import specific limiters into routes that need them.
 */

const rateLimit = require("express-rate-limit");

// ── Generic 429 response ──────────────────────────────────────────────────────
const rateLimitHandler = (req, res) =>
  res.status(429).json({
    error: "Too many requests. Please slow down and try again later.",
  });

/**
 * Normalise the client IP so express-rate-limit never receives an IPv6
 * address object — it must always be a plain string.
 * ::1 (IPv6 loopback) is mapped to 127.0.0.1 for consistency in dev.
 */
const getKey = (req) => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  // Strip IPv6-mapped IPv4 prefix (e.g. "::ffff:127.0.0.1" → "127.0.0.1")
  return ip.replace(/^::ffff:/, "");
};

// ── Auth endpoints (login / signup / refresh) — strict ───────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getKey,
});

// ── Contact-us form — prevent spam ───────────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getKey,
});

// ── Order placement — prevent order flooding ─────────────────────────────────
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getKey,
});

// ── General API — broad protection ───────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getKey,
});

// ── Upload endpoint — prevent abuse ──────────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getKey,
});

module.exports = {
  authLimiter,
  contactLimiter,
  orderLimiter,
  generalLimiter,
  uploadLimiter,
};
