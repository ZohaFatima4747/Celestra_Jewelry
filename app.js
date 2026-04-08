require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./conn/connection");

const cartRoutes     = require("./routes/cartRoutes");
const orderRoutes    = require("./routes/orderRoutes");
const productRoutes  = require("./routes/productRoutes");
const wishlistRoutes = require("./routes/wishlist");
const adminRoutes    = require("./routes/adminRoutes");
const messageRoutes  = require("./routes/messageRoutes");
const uploadRoutes   = require("./routes/uploadRoutes");
const authRoutes     = require("./routes/contact");
const contactUsRoutes = require("./routes/contactUsRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/product-images", express.static(path.join(__dirname, "../frontend/src/assets")));
app.use("/assets",  express.static(path.join(__dirname, "../frontend/dist/assets")));

// Database
connectDB();

// API Routes
app.use("/api/products",   productRoutes);
app.use("/api/cart",       cartRoutes);
app.use("/api/orders",     orderRoutes);
app.use("/api/wishlist",   wishlistRoutes);
app.use("/api/admin",      adminRoutes);
app.use("/api/messages",   messageRoutes);
app.use("/api/upload",     uploadRoutes);
app.use("/api/v1/auth",    authRoutes);
app.use("/api/contact-us", contactUsRoutes);

// Serve main frontend (React)
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("/*splat", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Serve dashboard frontend (React)
app.use("/dashboard", express.static(path.join(__dirname, "../dashboard/client/dist")));
app.get("/dashboard/*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "../dashboard/client/dist/index.html"));
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));