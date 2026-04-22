const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Contact = require("../models/contact");
const Message = require("../models/Message");
const { orderLimiter } = require("../middleware/security");
const { authMiddleware } = require("../middleware/auth");
const logger = require("../utils/logger");
const sendOrderConfirmation        = require("../utils/sendOrderConfirmation");
const sendOrderCancelled           = require("../utils/sendOrderCancelled");
const sendAdminOrderNotification   = require("../utils/sendAdminOrderNotification");

// ── Pakistan location data (mirrors frontend) ─────────────────────────────────
const PAKISTAN_LOCATIONS = {
  Punjab:      ["Bahawalpur","Burewala","Chiniot","Dera Ghazi Khan","Faisalabad","Gujranwala","Gujrat","Hafizabad","Jhang","Jhelum","Kasur","Lahore","Multan","Okara","Rahim Yar Khan","Rawalpindi","Sahiwal","Sargodha","Sheikhupura","Sialkot","Vehari","Wah Cantt"],
  Sindh:       ["Badin","Dadu","Hyderabad","Jacobabad","Karachi","Khairpur","Kotri","Larkana","Mirpur Khas","Nawabshah","Sanghar","Shikarpur","Sukkur","Tando Adam","Thatta"],
  KPK:         ["Abbottabad","Bannu","Battagram","Charsadda","Chitral","Dera Ismail Khan","Hangu","Haripur","Kohat","Mansehra","Mardan","Mingora","Nowshera","Peshawar","Swabi"],
  Balochistan: ["Chaman","Dera Murad Jamali","Gwadar","Hub","Kalat","Kharan","Khuzdar","Loralai","Mastung","Nushki","Panjgur","Quetta","Sibi","Turbat","Zhob"],
  Islamabad:   ["Islamabad"],
};
const VALID_PROVINCES = Object.keys(PAKISTAN_LOCATIONS);

/** Validate customer fields; returns array of error strings (empty = valid). */
const validateCustomer = (c) => {
  const errs = [];
  if (!c?.name?.trim())     errs.push("Customer name is required.");
  if (!c?.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()))
    errs.push("Please enter a valid email address.");
  if (!c?.phone?.trim()) {
    errs.push("Phone number is required.");
  } else {
    const digits = c.phone.trim().replace(/[\s+]/g, "");
    if (!/^03\d{9}$/.test(digits) && !/^923\d{9}$/.test(digits))
      errs.push("Please enter a valid Pakistani phone number.");
  }
  if (!c?.province || !VALID_PROVINCES.includes(c.province))
    errs.push("Please select a valid province.");
  if (!c?.city?.trim() || c.city.trim().length < 2)
    errs.push("Please enter or select a city.");
  if (!c?.address?.trim() || c.address.trim().length < 5)
    errs.push("Please enter a complete address.");
  return errs;
};

// ── POST /api/orders/complete-payment ─────────────────────────────────────────
router.post("/complete-payment", orderLimiter, async (req, res) => {
  const { userId, customer, items: bodyItems, total: bodyTotal } = req.body;

  if (!userId || !customer)
    return res.status(400).json({ error: "Missing required fields" });

  const validationErrors = validateCustomer(customer);
  if (validationErrors.length)
    return res.status(422).json({ error: validationErrors[0], errors: validationErrors });

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

    // ── Stock validation & atomic decrement ──────────────────────────────────
    // Collect all productIds that are real ObjectIds (guest carts may have
    // string IDs that don't exist in the DB — skip those gracefully).
    const stockDeducted = []; // track what we decremented so we can roll back

    for (const item of cartItems) {
      const pid = item.product._id;
      if (!pid || !/^[a-f\d]{24}$/i.test(String(pid))) continue;

      // Atomically decrement only if stock is sufficient.
      // $inc with a negative value + $gte condition prevents going below 0.
      const updated = await Product.findOneAndUpdate(
        { _id: pid, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
        { new: false } // return original doc so we can log the before-value
      );

      if (!updated) {
        // Either product not found or stock was insufficient — roll back any
        // decrements already applied in this loop iteration.
        for (const { productId, qty } of stockDeducted) {
          await Product.findByIdAndUpdate(productId, { $inc: { stock: qty } });
        }

        // Fetch the product name for a helpful error message
        const prod = await Product.findById(pid).select("name stock").lean();
        const label = prod?.name || String(pid);
        return res.status(409).json({
          error: `Insufficient stock for product: ${label}`,
        });
      }

      stockDeducted.push({ productId: pid, qty: item.qty });
    }

    // ── Create order (stock already reserved above) ───────────────────────────
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

    try {
      await order.save();
    } catch (saveErr) {
      // Order failed to persist — roll back every stock decrement
      for (const { productId, qty } of stockDeducted) {
        await Product.findByIdAndUpdate(productId, { $inc: { stock: qty } });
      }
      throw saveErr; // re-throw so the outer catch returns 500
    }

    // Send order confirmation email to customer (non-blocking)
    sendOrderConfirmation(order).catch((err) =>
      logger.warn({ err }, "[EMAIL] Order confirmation failed")
    );

    // Notify admin of new order (non-blocking — must not affect order placement)
    sendAdminOrderNotification(order).catch((err) =>
      logger.warn({ err }, "[EMAIL] Admin order notification failed")
    );

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

        let guestContact = await Contact.findOne({ email: guestEmail });

        if (guestContact && !guestContact.isGuest) {
          // Full account exists — skip, don't overwrite
        } else if (guestContact) {
          // Update existing guest record with latest order info
          guestContact.name     = guestName;
          guestContact.phone    = customer.phone    || guestContact.phone;
          guestContact.province = customer.province || guestContact.province;
          guestContact.city     = customer.city     || guestContact.city;
          guestContact.address  = customer.address  || guestContact.address;
          await guestContact.save();
        } else {
          // Create new guest contact
          await Contact.create({
            name:     guestName,
            email:    guestEmail,
            phone:    customer.phone    || null,
            province: customer.province || null,
            city:     customer.city     || null,
            address:  customer.address  || null,
            isGuest:  true,
            password: null,
          });
        }
      } catch (err) {
        logger.warn({ err }, "[GUEST] Failed to save guest contact");
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
      logger.warn({ err }, "Failed to save order notifications");
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
    logger.error({ err }, "Order placement error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PUT /api/orders/:orderId/status ───────────────────────────────────────────
// Users can only cancel their own pending orders
router.put("/:orderId/status", authMiddleware, async (req, res) => {
  const { status } = req.body;
  if (status !== "cancelled")
    return res.status(400).json({ error: "Only cancellation is allowed via this endpoint." });

  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // ── Ownership check ───────────────────────────────────────────────────────
    // Allow if: admin, OR sessionId matches, OR customer email matches the
    // authenticated user's email (covers orders placed as guest then logged in).
    const isAdmin = req.user.role === "admin";
    const sessionMatch = String(order.sessionId) === String(req.user.id);
    const emailMatch =
      req.user.email &&
      order.customer?.email &&
      order.customer.email.toLowerCase() === req.user.email.toLowerCase();

    if (!isAdmin && !sessionMatch && !emailMatch) {
      logger.warn(
        { orderId: order._id, sessionId: order.sessionId, userId: req.user.id, userEmail: req.user.email },
        "[AUTH] Cancel ownership check failed"
      );
      return res.status(403).json({ error: "Forbidden" });
    }

    if (order.status !== "pending COD")
      return res.status(400).json({ error: "Only pending orders can be cancelled." });

    // ── Restore stock before marking cancelled ────────────────────────────────
    // Guard: order.status !== "cancelled" is already enforced above, so no
    // double-restoration is possible through this endpoint.
    for (const item of order.items) {
      if (!item.productId || !/^[a-f\d]{24}$/i.test(String(item.productId))) continue;
      await Product.findOneAndUpdate(
        { _id: item.productId },
        { $inc: { stock: item.qty } }
      );
      logger.info(
        { productId: item.productId, qty: item.qty, orderId: order._id },
        "[STOCK] Restored on user cancellation"
      );
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status: "cancelled" },
      { new: true }
    );

    logger.info({ orderId: order._id }, "[ORDER] Cancelled by user — stock restored");

    try {
      await Message.create({
        userId: order.sessionId,
        title: "Order Cancelled ❌",
        body: `Your order #${String(order._id).slice(-8).toUpperCase()} has been cancelled.`,
        orderId: order._id,
        type: "order_cancelled",
      });
    } catch (err) {
      logger.warn({ err }, "Failed to save cancellation notification");
    }

    // Send cancellation email (non-blocking)
    sendOrderCancelled(order).catch((err) =>
      logger.warn({ err }, "[EMAIL] Cancelled notification failed")
    );

    res.json({ success: true, order: updated });
  } catch (err) {
    logger.error({ err }, "Error updating order status");
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/orders/user/:userId ──────────────────────────────────────────────
router.get("/user/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params;

  // Users can only fetch their own orders
  if (req.user.id !== userId && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

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
    logger.error({ err }, "GET /orders/user/:userId failed");
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
