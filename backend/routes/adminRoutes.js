const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Contact = require("../models/contact");
const Product = require("../models/Product");
const Message = require("../models/Message");
const { adminAuth } = require("../middleware/auth");
const logger = require("../utils/logger");
const sendOrderShipped   = require("../utils/sendOrderShipped");
const sendOrderDelivered = require("../utils/sendOrderDelivered");
const sendOrderCancelled = require("../utils/sendOrderCancelled");
const upload = require("../middleware/upload");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// ── STATS (aggregation — no full collection fetch) ────────────────────────────
// GET /api/admin/stats
router.get("/stats", adminAuth, async (_req, res) => {
  try {
    const [orderStats] = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders:      { $sum: 1 },
          totalRevenue:     { $sum: { $cond: [{ $in: ["$status", ["delivered", "completed"]] }, "$total", 0] } },
          completedOrders:  { $sum: { $cond: [{ $in: ["$status", ["delivered", "completed"]] }, 1, 0] } },
          cancelledOrders:  { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
          pendingOrders:    { $sum: { $cond: [{ $in: ["$status", ["pending COD", "shipped"]] }, 1, 0] } },
        },
      },
    ]);

    const totalUsers = await Contact.countDocuments({ role: "user" });

    // Last 7 days revenue — one aggregation, no JS filtering
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyData = await Order.aggregate([
      { $match: { status: { $in: ["delivered", "completed"] }, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build a full 7-day array (fill gaps with 0)
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = dailyData.find((x) => x._id === key);
      last7.push({
        day: d.toLocaleDateString("en-PK", { weekday: "short" }),
        revenue: found?.revenue || 0,
        orders:  found?.orders  || 0,
      });
    }

    res.json({
      totalRevenue:     orderStats?.totalRevenue     || 0,
      totalOrders:      orderStats?.totalOrders      || 0,
      completedOrders:  orderStats?.completedOrders  || 0,
      pendingOrders:    orderStats?.pendingOrders     || 0,
      cancelledOrders:  orderStats?.cancelledOrders  || 0,
      totalUsers,
      last7,
    });
  } catch (err) {
    logger.error({ err }, "GET /admin/stats failed");
    res.status(500).json({ message: "Server error" });
  }
});

// ── CREATE MANUAL ORDER ───────────────────────────────────────────────────────
// POST /api/admin/orders/manual
router.post("/orders/manual", adminAuth, async (req, res) => {
  try {
    const { customer, items, status } = req.body;

    if (!customer?.name?.trim())
      return res.status(400).json({ message: "Customer name is required" });
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "At least one item is required" });

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name?.trim())
        return res.status(400).json({ message: `Item ${i + 1}: product name is required` });
      if (!item.qty || isNaN(Number(item.qty)) || Number(item.qty) < 1)
        return res.status(400).json({ message: `Item ${i + 1}: valid quantity is required` });
      if (item.price === undefined || isNaN(Number(item.price)) || Number(item.price) < 0)
        return res.status(400).json({ message: `Item ${i + 1}: valid price is required` });
    }

    // Auto-fetch costPrice from Product collection for each item that has a productId
    const productIds = items
      .map((i) => i.productId)
      .filter((id) => id && /^[a-f\d]{24}$/i.test(id));

    const dbProducts = productIds.length > 0
      ? await Product.find({ _id: { $in: productIds } }).select("_id costPrice").lean()
      : [];

    const costMap = {};
    dbProducts.forEach((p) => { costMap[String(p._id)] = p.costPrice || 0; });

    const parsedItems = items.map((item) => {
      const autoCost = item.productId ? (costMap[String(item.productId)] ?? 0) : 0;
      return {
        productId: item.productId || undefined,
        name:      item.name.trim(),
        price:     Number(item.price),
        costPrice: autoCost,
        qty:       Number(item.qty),
        selectedSize:  item.selectedSize  || null,
        selectedColor: item.selectedColor || null,
      };
    });

    const total     = parsedItems.reduce((s, i) => s + i.price * i.qty, 0);
    const totalCost = parsedItems.reduce((s, i) => s + i.costPrice * i.qty, 0);
    const profit    = total - totalCost;

    const allowedStatuses = ["pending COD", "shipped", "delivered", "cancelled", "completed"];
    const orderStatus = allowedStatuses.includes(status) ? status : "completed";

    // ── Stock validation & atomic decrement (items with a known productId) ────
    const stockDeducted = [];

    for (const item of parsedItems) {
      if (!item.productId || !/^[a-f\d]{24}$/i.test(String(item.productId))) continue;

      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
        { new: false }
      );

      if (!updated) {
        // Roll back any decrements already applied
        for (const { productId, qty } of stockDeducted) {
          await Product.findByIdAndUpdate(productId, { $inc: { stock: qty } });
        }
        const prod = await Product.findById(item.productId).select("name stock").lean();
        const label = prod?.name || String(item.productId);
        return res.status(409).json({ message: `Insufficient stock for product: ${label}` });
      }

      stockDeducted.push({ productId: item.productId, qty: item.qty });
    }

    const order = new Order({
      orderType: "manual",
      sessionId: "manual",
      items: parsedItems,
      total,
      totalCost,
      profit,
      status: orderStatus,
      customer: {
        name:     customer.name.trim(),
        email:    customer.email?.trim()    || "",
        phone:    customer.phone?.trim()    || "",
        province: customer.province?.trim() || "",
        city:     customer.city?.trim()     || "",
        address:  customer.address?.trim()  || "",
      },
    });

    try {
      await order.save();
    } catch (saveErr) {
      // Roll back stock decrements if order fails to persist
      for (const { productId, qty } of stockDeducted) {
        await Product.findByIdAndUpdate(productId, { $inc: { stock: qty } });
      }
      throw saveErr;
    }

    // Admin notification
    try {
      await Message.create({
        userId: "admin",
        title: "Manual Order Created 🧾",
        body: `Manual order #${String(order._id).slice(-8).toUpperCase()} for ${order.customer.name} — PKR ${total.toLocaleString()} (Profit: PKR ${profit.toLocaleString()})`,
        orderId: order._id,
        type: "status_update",
      });
    } catch (msgErr) {
      logger.warn({ err: msgErr }, "Failed to save manual order notification");
    }

    logger.info({ orderId: order._id }, "Manual order created");
    res.status(201).json({ success: true, order });
  } catch (err) {
    logger.error({ err }, "POST /admin/orders/manual failed");
    res.status(500).json({ message: "Server error" });
  }
});

// ── ALL ORDERS (paginated) ────────────────────────────────────────────────────
// GET /api/admin/orders?page=1&limit=50
router.get("/orders", adminAuth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(),
    ]);

    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, "GET /admin/orders failed");
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

    if (status === "delivered") {
      const shortId = `#${String(order._id).slice(-8).toUpperCase()}`;
      try {
        await Message.create([
          {
            userId: order.sessionId,
            title: "Order Delivered 🎉",
            body: `Your order ${shortId} has been delivered. Thank you for shopping with us!`,
            orderId: order._id,
            type: "status_update",
          },
          {
            userId: "admin",
            title: "Order Marked as Delivered ✅",
            body: `Order ${shortId} for ${order.customer?.name || "customer"} has been marked as delivered. Total: PKR ${order.total?.toLocaleString()}`,
            orderId: order._id,
            type: "status_update",
          },
        ]);
      } catch (msgErr) {
        logger.warn({ err: msgErr }, "Failed to save delivery notifications");
      }
    }

    if (status === "shipped") {
      sendOrderShipped(order).catch((err) =>
        logger.warn({ err }, "[EMAIL] Shipped notification failed")
      );
    } else if (status === "delivered") {
      sendOrderDelivered(order).catch((err) =>
        logger.warn({ err }, "[EMAIL] Delivered notification failed")
      );
    } else if (status === "cancelled") {
      sendOrderCancelled(order).catch((err) =>
        logger.warn({ err }, "[EMAIL] Cancelled notification failed")
      );
    }

    res.json({ success: true, order });
  } catch (err) {
    logger.error({ err }, "PUT /admin/orders/:id failed");
    res.status(500).json({ message: "Server error" });
  }
});

// ── ALL USERS (paginated) ─────────────────────────────────────────────────────
// GET /api/admin/users?page=1&limit=50
router.get("/users", adminAuth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      Contact.find({ role: "user" }).select("-password").sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      Contact.countDocuments({ role: "user" }),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, "GET /admin/users failed");
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
    logger.error({ err }, "DELETE /admin/users/:id failed");
    res.status(500).json({ message: "Server error" });
  }
});

// ── PRODUCTS (paginated) ──────────────────────────────────────────────────────
// GET /api/admin/products?page=1&limit=50
router.get("/products", adminAuth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(),
    ]);

    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, "GET /admin/products failed");
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/products
// Accepts either:
//   - multipart/form-data with "images" file field (uploaded directly to Cloudinary)
//   - application/json with "images" array of pre-uploaded Cloudinary URLs
router.post("/products", adminAuth, upload.array("images", 10), async (req, res) => {
  try {
    const { name, price, stock, category } = req.body;
    if (!name?.trim())                               return res.status(400).json({ message: "Product name is required" });
    if (price === undefined || isNaN(Number(price))) return res.status(400).json({ message: "Valid price is required" });
    if (!category?.trim())                           return res.status(400).json({ message: "Category is required" });

    let images = [];

    // Case 1: files uploaded via multipart — push to Cloudinary
    if (req.files && req.files.length > 0) {
      try {
        images = await Promise.all(
          req.files.map((file) => uploadToCloudinary(file.buffer))
        );
      } catch (uploadErr) {
        logger.error({ err: uploadErr }, "Cloudinary upload failed during product creation");
        return res.status(502).json({ message: "Image upload failed. Product was not created." });
      }
    } else {
      // Case 2: JSON body with pre-uploaded URLs
      const bodyImages = req.body.images;
      images = Array.isArray(bodyImages) ? bodyImages : (bodyImages ? [bodyImages] : []);
    }

    if (images.length === 0)
      return res.status(400).json({ message: "At least one image is required" });

    const product = new Product({
      ...req.body,
      name:     name.trim(),
      category: category.trim().toLowerCase(),
      price:    Number(price),
      stock:    Number(stock || 0),
      images,
    });
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (err) {
    logger.error({ err }, "POST /admin/products failed");
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/products/:productId
router.put("/products/:productId", adminAuth, upload.array("images", 10), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.category)          updates.category = updates.category.trim().toLowerCase();
    if (updates.price !== undefined) updates.price   = Number(updates.price);
    if (updates.stock !== undefined) updates.stock   = Number(updates.stock);

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      try {
        const newImages = await Promise.all(
          req.files.map((file) => uploadToCloudinary(file.buffer))
        );
        updates.images = newImages;
      } catch (uploadErr) {
        logger.error({ err: uploadErr }, "Cloudinary upload failed during product update");
        return res.status(502).json({ message: "Image upload failed. Product was not updated." });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      updates,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    logger.error({ err }, "PUT /admin/products/:id failed");
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/products/:productId
router.delete("/products/:productId", adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.productId);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/products/:id failed");
    res.status(500).json({ message: "Server error" });
  }
});

// ── SALES / FINANCE ───────────────────────────────────────────────────────────
// GET /api/admin/sales
router.get("/sales", adminAuth, async (_req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const completedStatuses = ["delivered", "completed"];

    const [monthlyRaw, paymentRaw, totals] = await Promise.all([
      // Monthly revenue for last 6 months (delivered + completed)
      Order.aggregate([
        { $match: { status: { $in: completedStatuses }, createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            revenue: { $sum: "$total" },
            profit:  { $sum: { $cond: [{ $gt: ["$profit", 0] }, "$profit", { $multiply: ["$total", 0.3] }] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Payment method breakdown
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            total: { $sum: "$total" },
          },
        },
      ]),
      // Overall totals
      Order.aggregate([
        { $match: { status: { $in: completedStatuses } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$total" },
            profit:  { $sum: { $cond: [{ $gt: ["$profit", 0] }, "$profit", { $multiply: ["$total", 0.3] }] } },
          },
        },
      ]),
    ]);

    // Build 6-month array filling gaps
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key   = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString("en-PK", { month: "short", year: "numeric" });
      const found = monthlyRaw.find((x) => x._id === key);
      const revenue = found?.revenue || 0;
      const profit  = found?.profit  || 0;
      monthlyData.push({ month: label, revenue, profit, loss: 0 });
    }

    const paymentSummary = { COD: 0, Online: 0 };
    paymentRaw.forEach(({ _id: status, total }) => {
      if (status === "pending COD" || status === "shipped") paymentSummary.COD += total;
      else paymentSummary.Online += total;
    });

    const totalRevenue = totals[0]?.revenue || 0;
    const totalProfit  = totals[0]?.profit  || 0;
    res.json({ monthlyData, paymentSummary, totalRevenue, totalProfit });
  } catch (err) {
    logger.error({ err }, "GET /admin/sales failed");
    res.status(500).json({ message: "Server error" });
  }
});

// ── ALERTS ────────────────────────────────────────────────────────────────────
// GET /api/admin/alerts
router.get("/alerts", adminAuth, async (_req, res) => {
  try {
    const [lowStock, pendingOrders] = await Promise.all([
      Product.find({ stock: { $lte: 5 } }).select("name stock category").lean(),
      Order.find({ status: { $in: ["pending COD", "shipped"] } })
        .select("customer.name total createdAt status")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);
    res.json({ lowStock, pendingOrders });
  } catch (err) {
    logger.error({ err }, "GET /admin/alerts failed");
    res.status(500).json({ message: "Server error" });
  }
});

// ── ADMIN NOTIFICATIONS ───────────────────────────────────────────────────────
// GET /api/admin/notifications
router.get("/notifications", adminAuth, async (_req, res) => {
  try {
    const notifications = await Message.find({ userId: "admin" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(notifications);
  } catch (err) {
    logger.error({ err }, "GET /admin/notifications failed");
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/admin/notifications/read-all  ← must be before /:id/read
router.patch("/notifications/read-all", adminAuth, async (_req, res) => {
  try {
    await Message.updateMany({ userId: "admin" }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/notifications/read-all failed");
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/admin/notifications/:id/read
router.patch("/notifications/:id/read", adminAuth, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: "Not found" });
    res.json(msg);
  } catch (err) {
    logger.error({ err }, "PATCH /admin/notifications/:id/read failed");
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
