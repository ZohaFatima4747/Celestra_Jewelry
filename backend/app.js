const express = require("express");
const cors = require("cors");
const connectDB = require("./conn/connection");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const Product = require("./models/Product");
const paymentRoutes = require("./routes/paymentRoutes");
const wishlistRoutes = require("./routes/wishlist");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ✅ Middleware first
app.use(express.json());
app.use(cors());

// ✅ MongoDB Connect
connectDB();

// ✅ Routes
app.use("/api/payment", paymentRoutes); // Payment API
app.use("/api/cart", cartRoutes); // Cart API
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes); // Orders/Checkout API
app.use("/api/admin", adminRoutes);

const authRoutes = require("./routes/contact");
app.use("/api/v1/auth", authRoutes);
// Products route
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Grace E-commerce Backend Running...");
});

// Start server
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
