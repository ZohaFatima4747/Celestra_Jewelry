const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Contact = require("../models/contact");
const Product = require("../models/Product");
const Message = require("../models/Message");
const { adminAuth } = require("../middleware/auth");
const sendOrderShipped   = require("../utils/sendOrderShipped");
const sendOrderDelivered = require("../utils/sendOrderDelivered");
const sendOrderCancelled = require("../utils/sendOrderCancelled");

// ── STATS ─────────────────────────────────────────
// GET /api/admin/stats
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const allOrders = await Order.find({});
    const allUsers  = await Contact.find({});

    const totalRevenue = allOrders
      .filter(o => o.status === "delivered")
      .reduce((sum, o) => sum + o.total, 0);

    const totalOrders     = allOrders.length;
    const completedOrders = allOrders.filter(o => o.status === "delivered").length;
    const pendingOrders   = allOrders.filter(o => o.status === "pending COD" || o.status === "shipped").length;
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
        return created >= dayStart && created <= dayEnd && o.status === "delivered";
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
  const allowed = ["pending COD", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status))
    return res.status(400).json({ message: "Invalid status" });

  try {
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Fire notifications on delivered
    if (status === "delivered") {
      const orderId = order._id;
      const shortId = `#${String(orderId).slice(-8).toUpperCase()}`;
      try {
        await Message.create({
          userId: order.sessionId,
          title: "Order Delivered 🎉",
          body: `Your order ${shortId} has been delivered. Thank you for shopping with us!`,
          orderId,
          type: "status_update",
        });
        await Message.create({
          userId: "admin",
          title: "Order Marked as Delivered ✅",
          body: `Order ${shortId} for ${order.customer?.name || "customer"} has been marked as delivered. Total: PKR ${order.total?.toLocaleString()}`,
          orderId,
          type: "status_update",
        });
      } catch (msgErr) {
        console.error("Failed to save delivery notifications:", msgErr.message);
      }
    }

    // Status-based email triggers (non-blocking)
    if (status === "shipped") {
      sendOrderShipped(order).catch((err) =>
        console.error("[EMAIL] Shipped notification failed:", err.message)
      );
    } else if (status === "delivered") {
      sendOrderDelivered(order).catch((err) =>
        console.error("[EMAIL] Delivered notification failed:", err.message)
      );
    } else if (status === "cancelled") {
      sendOrderCancelled(order).catch((err) =>
        console.error("[EMAIL] Cancelled notification failed:", err.message)
      );
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── ALL USERS ─────────────────────────────────────
// GET /api/admin/users
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await Contact.find({ role: "user" }).select("-password").sort({ _id: -1 });
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

// ── PRODUCTS ──────────────────────────────────────
// GET /api/admin/products
router.get("/products", adminAuth, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/products
router.post("/products", adminAuth, async (req, res) => {
  try {
    const { name, price, stock, category, images } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Product name is required" });
    if (price === undefined || price === null || isNaN(Number(price))) return res.status(400).json({ message: "Valid price is required" });
    if (!category || !category.trim()) return res.status(400).json({ message: "Category is required" });
    if (!images || !Array.isArray(images) || images.length === 0) return res.status(400).json({ message: "At least one image is required" });

    const payload = {
      ...req.body,
      name: name.trim(),
      category: category.trim().toLowerCase(),
      price: Number(price),
      stock: Number(stock || 0),
    };
    const product = new Product(payload);
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/products/:productId
router.put("/products/:productId", adminAuth, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.category) updates.category = updates.category.trim().toLowerCase();
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);

    const product = await Product.findByIdAndUpdate(req.params.productId, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/products/:productId
router.delete("/products/:productId", adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.productId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── SALES / FINANCE ───────────────────────────────
// GET /api/admin/sales
router.get("/sales", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find({ status: "delivered" });

    // Monthly revenue for last 6 months
    const monthly = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-PK", { month: "short", year: "numeric" });
      monthly[key] = 0;
    }

    orders.forEach((o) => {
      const key = new Date(o.createdAt).toLocaleDateString("en-PK", { month: "short", year: "numeric" });
      if (key in monthly) monthly[key] += o.total;
    });

    const monthlyData = Object.entries(monthly).map(([month, revenue]) => ({
      month,
      revenue,
      profit: revenue * 0.3, // estimated 30% margin
      loss: 0,
    }));

    // Payment method summary (all orders)
    const allOrders = await Order.find({});
    const paymentSummary = { COD: 0, Online: 0 };
    allOrders.forEach((o) => {
      if (o.status === "pending COD" || o.status === "shipped") paymentSummary.COD += o.total;
      else paymentSummary.Online += o.total;
    });

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalProfit = totalRevenue * 0.3;

    res.json({ monthlyData, paymentSummary, totalRevenue, totalProfit });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── ALERTS ────────────────────────────────────────
// GET /api/admin/alerts
router.get("/alerts", adminAuth, async (req, res) => {
  try {
    const lowStock = await Product.find({ stock: { $lte: 5 } }).select("name stock category");
    const pendingOrders = await Order.find({ status: { $in: ["pending COD", "shipped"] } })
      .select("customer.name total createdAt status")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ lowStock, pendingOrders });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── ADMIN NOTIFICATIONS ───────────────────────────
// GET /api/admin/notifications
router.get("/notifications", adminAuth, async (req, res) => {
  try {
    const notifications = await Message.find({ userId: "admin" }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/admin/notifications/read-all  ← must be before /:id/read
router.patch("/notifications/read-all", adminAuth, async (req, res) => {
  try {
    await Message.updateMany({ userId: "admin" }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/admin/notifications/:id/read
router.patch("/notifications/:id/read", adminAuth, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!msg) return res.status(404).json({ message: "Not found" });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
