const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { authMiddleware } = require("../middleware/auth");

// All cart routes require authentication
router.use(authMiddleware);

/** Ensure the userId in the request body/query matches the authenticated user. */
const assertOwner = (reqUserId, tokenUser, res) => {
  if (reqUserId !== tokenUser.id && tokenUser.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
};

// POST /api/cart/add
router.post("/add", async (req, res) => {
  const { userId, productId, qty = 1, selectedSize, selectedColor } = req.body;
  if (!userId || !productId)
    return res.status(400).json({ error: "userId and productId required" });
  if (!assertOwner(userId, req.user, res)) return;

  // Validate qty
  const parsedQty = Number(qty);
  if (!Number.isInteger(parsedQty) || parsedQty < 1)
    return res.status(400).json({ error: "qty must be a positive integer" });

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    let cart = await Cart.findOne({ userId });
    if (!cart || cart.status === "completed") {
      cart = new Cart({ userId, items: [], total: 0, status: "pending" });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product._id.toString() === productId &&
        (item.selectedSize || null) === (selectedSize || null) &&
        (item.selectedColor || null) === (selectedColor || null)
    );

    if (existingItem) {
      existingItem.qty += parsedQty;
    } else {
      cart.items.push({
        product: product.toObject(),
        qty: parsedQty,
        selectedSize: selectedSize || null,
        selectedColor: selectedColor || null,
      });
    }

    cart.total = cart.items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    await cart.save();
    res.json(cart);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/cart/remove
router.post("/remove", async (req, res) => {
  const { userId, cartItemId } = req.body;
  if (!userId || !cartItemId)
    return res.status(400).json({ error: "userId and cartItemId required" });
  if (!assertOwner(userId, req.user, res)) return;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const index = cart.items.findIndex((item) => item._id.toString() === cartItemId);
    if (index === -1) return res.status(404).json({ error: "Item not found" });

    if (cart.items[index].qty > 1) {
      cart.items[index].qty -= 1;
    } else {
      cart.items.splice(index, 1);
    }

    cart.total = cart.items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    await cart.save();
    res.json(cart);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/cart/delete
router.post("/delete", async (req, res) => {
  const { userId, cartItemId } = req.body;
  if (!userId || !cartItemId)
    return res.status(400).json({ error: "userId and cartItemId required" });
  if (!assertOwner(userId, req.user, res)) return;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const index = cart.items.findIndex((item) => item._id.toString() === cartItemId);
    if (index === -1) return res.status(404).json({ error: "Item not found" });

    cart.items.splice(index, 1);
    cart.total = cart.items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    await cart.save();
    res.json(cart);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/cart?userId=
router.get("/", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });
  if (!assertOwner(userId, req.user, res)) return;

  try {
    const cart = await Cart.findOne({ userId });
    res.json(cart || { items: [], total: 0, status: "pending" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
