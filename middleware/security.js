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

// ── Auth endpoints (login / signup / refresh) — strict ───────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip,
});

// ── Contact-us form — prevent spam ───────────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip,
});

// ── Order placement — prevent order flooding ─────────────────────────────────
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip,
});

// ── General API — broad protection ───────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip,
});

// ── Upload endpoint — prevent abuse ──────────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.ip,
});

module.exports = {
  authLimiter,
  contactLimiter,
  orderLimiter,
  generalLimiter,
  uploadLimiter,
};
