require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const pinoHttp = require("pino-http");

const logger = require("./utils/logger");
const connectDB = require("./conn/connection");
const mongoose = require("mongoose");
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

// Vercel preview deployments use dynamic URLs — allow any subdomain of vercel.app
// that belongs to known project slugs, in addition to the explicit allowlist.
const VERCEL_PREVIEW_RE = /^https:\/\/celestra-[\w-]+-[\w-]+-[\w-]+\.vercel\.app$/;

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (VERCEL_PREVIEW_RE.test(origin)) return cb(null, true);
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
// Legacy product images — explicit handler so filenames with spaces, &, and
// other special characters are decoded correctly before hitting the filesystem.
app.get("/product-images/:filename(*)", corpCrossOrigin, (req, res) => {
  try {
    // Express decodes req.params automatically, so spaces (%20) and special
    // chars (%26 for &) are already resolved to their literal characters here.
    const filename = req.params.filename;
    const imagesDir = path.join(__dirname, "public/product-images");
    const filePath = path.resolve(imagesDir, filename);
    // Prevent path traversal
    if (!filePath.startsWith(imagesDir + path.sep) && filePath !== imagesDir) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.setHeader("Cache-Control", "public, max-age=604800"); // 7d
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: "Image not found" });
    });
  } catch {
    res.status(400).json({ error: "Invalid filename" });
  }
});
// Built frontend assets — content-hashed filenames, safe to cache forever
app.use("/assets", corpCrossOrigin, express.static(path.join(__dirname, "../frontend/dist/assets"), {
  maxAge: "1y",
  immutable: true,
}));

// ── Database ──────────────────────────────────────────────────────────────────
// connectDB() is called inside the async bootstrap below — server only starts after DB is ready

// ── Health check (no auth, no rate limit) ────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", uptime: process.uptime(), env: process.env.NODE_ENV, db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" })
);

// ── Root route ────────────────────────────────────────────────────────────────
app.get("/", (_req, res) =>
  res.status(200).json({ status: "success", message: "Celestra Jewelry API is running" })
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

// ── Serve frontend SPA (only when dist exists — skipped in API-only deployments) ──
const frontendDist = path.join(__dirname, "../frontend/dist");
const frontendIndex = path.join(frontendDist, "index.html");
if (require("fs").existsSync(frontendIndex)) {
  app.use(express.static(frontendDist));
  app.get("/*splat", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(frontendIndex);
  });
}

// ── Serve dashboard SPA (only when dist exists) ───────────────────────────────
const dashboardDist = path.join(__dirname, "../dashboard/client/dist");
const dashboardIndex = path.join(dashboardDist, "index.html");
if (require("fs").existsSync(dashboardIndex)) {
  app.use("/dashboard", express.static(dashboardDist));
  app.get("/dashboard/*splat", (_req, res) => {
    res.sendFile(dashboardIndex);
  });
}

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  res.status(err.status || 500).json({ error: "An unexpected error occurred." });
});

// ── Bootstrap: connect DB then start server ───────────────────────────────────
(async () => {
  try {
    await connectDB();
  } catch (err) {
    logger.error("DB connection failed during startup", err);
    process.exit(1);
  }

  const PORT = process.env.PORT || 1000;

  const server = app.listen(PORT, () =>
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`)
  );

  let isShuttingDown = false;

  const shutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      try {
        await mongoose.connection.close(false);
        logger.info("MongoDB connection closed");
        process.exit(0);
      } catch (err) {
        logger.error("Error during shutdown", err);
        process.exit(1);
      }
    });

    // Fallback force exit (prevents hanging on Heroku)
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
})();