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
app.use("/assets",  express.static(path.join(__dirname, "../frontend/src/assets")));

// Database
connectDB();

// Routes
app.use("/api/products",   productRoutes);
app.use("/api/cart",       cartRoutes);
app.use("/api/orders",     orderRoutes);
app.use("/api/wishlist",   wishlistRoutes);
app.use("/api/admin",      adminRoutes);
app.use("/api/messages",   messageRoutes);
app.use("/api/upload",     uploadRoutes);
app.use("/api/v1/auth",    authRoutes);
app.use("/api/contact-us", contactUsRoutes);

app.get("/", (_, res) => res.send("Celestra E-commerce API running."));

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
