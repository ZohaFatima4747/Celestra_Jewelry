const axios = require("axios");
const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Contact = require("../models/contact");
const Message = require("../models/Message");

// ── POST /api/orders/complete-payment ─────────────────────────────────────────
router.post("/complete-payment", async (req, res) => {
  const { userId, customer, items: bodyItems, total: bodyTotal } = req.body;

  if (!userId || !customer)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    let cartItems = null;
    let cartTotal = null;
    let dbCart = null;

    const isValidObjectId = /^[a-f\d]{24}$/i.test(userId);

    if (isValidObjectId) {
      try { dbCart = await Cart.findOne({ userId, status: "pending" }); }
      catch { dbCart = null; }
    }

    if (dbCart?.items.length > 0) {
      cartItems = dbCart.items;
      cartTotal = dbCart.items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    } else if (bodyItems?.length > 0) {
      cartItems = bodyItems.map((i) => ({
        product: { _id: i.productId, name: i.name, price: i.price },
        qty: i.qty,
        selectedSize: i.selectedSize || null,
        selectedColor: i.selectedColor || null,
      }));
      cartTotal = bodyTotal || bodyItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    } else {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const order = new Order({
      sessionId: userId,
      items: cartItems.map((item) => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        qty: item.qty,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
      })),
      total: cartTotal,
      status: "pending COD",
      customer,
    });

    await order.save();

    // Save guest contact if applicable
    const isGuestPrefix = userId.startsWith("guest_");
    let shouldSaveGuest = isGuestPrefix;

    if (!isGuestPrefix && isValidObjectId && customer.email) {
      const registeredUser = await Contact.findById(userId).lean();
      if (!registeredUser) shouldSaveGuest = true;
    }

    if (shouldSaveGuest && customer.email) {
      try {
        const guestEmail = customer.email.trim().toLowerCase();
        const guestName  = customer.name?.trim() || guestEmail.split("@")[0];
        const fullAccount = await Contact.findOne({ email: guestEmail, isGuest: false }).lean();
        if (!fullAccount) {
          await Contact.findOneAndUpdate(
            { email: guestEmail },
            {
              $setOnInsert: { email: guestEmail, isGuest: true, password: null, role: "user" },
              $set: { name: guestName, phone: customer.phone || null, city: customer.address || null },
            },
            { upsert: true, new: true }
          );
        }
      } catch (err) {
        console.error("[GUEST] Failed to save guest contact:", err.message);
      }
    }

    // In-app notifications
    const productNames = cartItems.map((i) => i.product.name).join(", ");
    const shortId = `#${String(order._id).slice(-8).toUpperCase()}`;

    try {
      await Message.create({
        userId,
        title: "Order Placed (COD – Pending) 🛒",
        body: `Your order for ${productNames} has been placed. Pay with Cash on Delivery. Total: PKR ${order.total.toFixed(2)}`,
        orderId: order._id,
        type: "order_placed",
      });
      await Message.create({
        userId: "admin",
        title: "New COD Order Received 📦",
        body: `${customer.name} placed a COD order for ${productNames}. Total: PKR ${order.total.toFixed(2)}. Order ID: ${shortId}`,
        orderId: order._id,
        type: "order_placed",
      });
    } catch (err) {
      console.error("Failed to save notifications:", err.message);
    }

    // Webhook notification (non-blocking)
    if (process.env.N8N_WEBHOOK_URL) {
      axios.post(process.env.N8N_WEBHOOK_URL, {
        customerName: customer.name,
        customerEmail: customer.email,
        product: cartItems.map((i) => i.product.name).join(", "),
        amount: order.total,
        orderId: order._id,
      }).catch((err) => console.error("Webhook failed:", err.message));
    }

    // Clear DB cart
    if (dbCart) {
      dbCart.items = [];
      dbCart.total = 0;
      dbCart.status = "pending";
      await dbCart.save();
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PUT /api/orders/:orderId/status ───────────────────────────────────────────
router.put("/:orderId/status", async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Missing status" });

  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.status !== "pending COD")
      return res.status(400).json({ error: "Only pending COD orders can be cancelled." });

    order.status = status;
    await order.save();

    try {
      await Message.create({
        userId: order.sessionId,
        title: "Order Cancelled ❌",
        body: `Your order #${String(order._id).slice(-8).toUpperCase()} has been cancelled.`,
        orderId: order._id,
        type: "order_cancelled",
      });
    } catch (err) {
      console.error("Failed to save cancellation notification:", err.message);
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/orders/user/:userId ──────────────────────────────────────────────
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    let orders = await Order.find({ sessionId: userId }).sort({ createdAt: -1 });

    const { email } = req.query;
    if (email) {
      const guestOrders = await Order.find({
        "customer.email": email,
        sessionId: { $ne: userId },
      }).sort({ createdAt: -1 });

      orders = [...orders, ...guestOrders].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
