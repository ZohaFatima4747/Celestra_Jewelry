const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const stripe = require("../conn/stripe");

router.post("/complete-payment", async (req, res) => {
  const { userId, paymentIntentId, customer } = req.body;

  if (!userId || !paymentIntentId || !customer)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const cart = await Cart.findOne({ userId, status: "pending" });
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ error: "Cart is empty" });

    let status = "completed";
    let receiptUrl = null;

    if (paymentIntentId !== "COD") {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          paymentIntentId
        );
        status = paymentIntent.status === "succeeded" ? "completed" : "failed";
        const charges = paymentIntent.charges?.data;
        if (charges && charges.length > 0) {             //<<<<<changes here
          receiptUrl = charges[0].receipt_url;
        }
      } catch (err) {
        console.error("Stripe retrieval error:", err);
        return res
          .status(400)
          .json({ error: "Invalid Stripe PaymentIntent ID" });
      }
    } else {
      status = "pending COD";
    }

    const order = new Order({
      sessionId: userId,
      items: cart.items.map((item) => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        qty: item.qty,
      })),
      total: cart.items.reduce(
        (sum, item) => sum + item.product.price * item.qty,
        0
      ),
      status,
      receiptUrl,
      customer,
    });

    await order.save();

    cart.items = [];
    cart.total = 0;
    cart.status = "pending";
    await cart.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.put("/:orderId/status", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: "Missing status" });

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // ✅ Only allow cancel if order is pending COD
    if (order.status !== "pending COD") {
      return res.status(400).json({
        error: "Order cannot be cancelled. Only pending COD orders can be cancelled.",
      });
    }

    order.status = status; // e.g., "cancelled"
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const orders = await Order.find({ sessionId: userId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
