require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const pinoHttp = require("pino-http");

const logger = require("./utils/logger");
const connectDB = require("./conn/connection");
const sanitizeMiddleware = require("./middleware/sanitize");
const { generalLimiter, authLimiter } = require("./middleware/security");

const cartRoutes      = require("./routes/cartRoutes");
const orderRoutes     = require("./routes/orderRoutes");
const productRoutes   = require("./routes/productRoutes");
const wishlistRoutes  = require("./routes/wishlist");
const adminRoutes     = require("./routes/adminRoutes");
const messageRoutes   = require("./routes/messageRoutes");
const uploadRoutes    = require("./routes/uploadRoutes");
const authRoutes      = require("./routes/contact");
const contactUsRoutes = require("./routes/contactUsRoutes");

const app = express();

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({
  // Allow inline styles/scripts needed by the React SPA
  contentSecurityPolicy: false,
}));

// ── CORS — restrict to known frontend origins ─────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Request logging ───────────────────────────────────────────────────────────
app.use(pinoHttp({ logger, autoLogging: process.env.NODE_ENV === "production" }));

// ── Body parsing with size limit ──────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: "10kb" }));

// ── NoSQL injection sanitisation (applied globally) ───────────────────────────
app.use(sanitizeMiddleware);

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use("/api", generalLimiter);

// ── Static files ──────────────────────────────────────────────────────────────
// Override CORP header for image routes so cross-origin pages (dashboard dev server) can load them
const corpCrossOrigin = (_req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
};

// Uploaded product images — content-addressed by timestamp prefix, safe to cache 30 days
app.use("/uploads", corpCrossOrigin, express.static(path.join(__dirname, "uploads"), {
  maxAge: "30d",
  immutable: false,
  etag: true,
  lastModified: true,
}));
// Legacy product images from public folder
app.use("/product-images", corpCrossOrigin, express.static(path.join(__dirname, "../frontend/public/product-images"), {
  maxAge: "7d",
  etag: true,
  lastModified: true,
}));
// Built frontend assets — content-hashed filenames, safe to cache forever
app.use("/assets", corpCrossOrigin, express.static(path.join(__dirname, "../frontend/dist/assets"), {
  maxAge: "1y",
  immutable: true,
}));

// ── Database ──────────────────────────────────────────────────────────────────
connectDB();

// ── Health check (no auth, no rate limit) ────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", uptime: process.uptime(), env: process.env.NODE_ENV })
);

// ── API Routes ────────────────────────────────────────────────────────────────
// Auth routes get the stricter authLimiter on top of generalLimiter
app.use("/api/v1/auth",    authLimiter, authRoutes);
app.use("/api/products",   productRoutes);
app.use("/api/cart",       cartRoutes);
app.use("/api/orders",     orderRoutes);
app.use("/api/wishlist",   wishlistRoutes);
app.use("/api/admin",      adminRoutes);
app.use("/api/messages",   messageRoutes);
app.use("/api/upload",     uploadRoutes);
app.use("/api/contact-us", contactUsRoutes);

// ── Serve frontend SPA ────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("/*splat", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ── Serve dashboard SPA ───────────────────────────────────────────────────────
app.use("/dashboard", express.static(path.join(__dirname, "../dashboard/client/dist")));
app.get("/dashboard/*splat", (_req, res) => {
  res.sendFile(path.join(__dirname, "../dashboard/client/dist/index.html"));
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  res.status(err.status || 500).json({ error: "An unexpected error occurred." });
});

// ── Start server + graceful shutdown ─────────────────────────────────────────
const PORT = process.env.PORT || 1000;
const server = app.listen(PORT, () =>
  logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`)
);

const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    const mongoose = require("mongoose");
    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
