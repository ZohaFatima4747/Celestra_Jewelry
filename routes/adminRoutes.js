const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Contact = require("../models/contact");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "your_secret_key_here"; // same as auth routes

// ── ADMIN MIDDLEWARE ──────────────────────────────
const adminAuth = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
    if (decoded.role !== "admin")
      return res.status(403).json({ message: "Admin only" });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ── STATS ─────────────────────────────────────────
// GET /api/admin/stats
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const allOrders = await Order.find({});
    const allUsers  = await Contact.find({});

    const totalRevenue = allOrders
      .filter(o => o.status === "completed")
      .reduce((sum, o) => sum + o.total, 0);

    const totalOrders    = allOrders.length;
    const completedOrders = allOrders.filter(o => o.status === "completed").length;
    const pendingOrders   = allOrders.filter(o => o.status === "pending COD" || o.status === "pending").length;
    const cancelledOrders = allOrders.filter(o => o.status === "cancelled").length;
    const totalUsers      = allUsers.filter(u => u.role !== "admin").length;

    // Last 7 days revenue chart data
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd   = new Date(date.setHours(23, 59, 59, 999));

      const dayOrders = allOrders.filter(o => {
        const created = new Date(o.createdAt);
        return created >= dayStart && created <= dayEnd && o.status === "completed";
      });

      last7.push({
        day: dayStart.toLocaleDateString("en-PK", { weekday: "short" }),
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      });
    }

    res.json({
      totalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalUsers,
      last7,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── ALL ORDERS ────────────────────────────────────
// GET /api/admin/orders
router.get("/orders", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE ORDER STATUS
// PUT /api/admin/orders/:orderId
router.put("/orders/:orderId", adminAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ["pending", "pending COD", "shipped", "delivered", "completed", "cancelled"];
  if (!allowed.includes(status))
    return res.status(400).json({ message: "Invalid status" });

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── ALL USERS ─────────────────────────────────────
// GET /api/admin/users
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await Contact.find({ role: "user" }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE USER
// DELETE /api/admin/users/:userId
router.delete("/users/:userId", adminAuth, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;