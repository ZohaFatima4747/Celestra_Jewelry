const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ✅ ADD TO CART
router.post("/add", async (req, res) => {
  const { userId, productId, qty = 1, selectedSize, selectedColor } = req.body;
  if (!userId || !productId)
    return res.status(400).json({ error: "userId and productId required" });

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
      existingItem.qty += Number(qty);
    } else {
      cart.items.push({
        product: product.toObject(),
        qty: Number(qty),
        selectedSize: selectedSize || null,
        selectedColor: selectedColor || null,
      });
    }

    cart.total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.qty,
      0,
    );

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ REMOVE FROM CART
router.post("/remove", async (req, res) => {
  const { userId, cartItemId } = req.body;
  if (!userId || !cartItemId)
    return res.status(400).json({ error: "userId and cartItemId required" });

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const index = cart.items.findIndex(
      (item) => item._id.toString() === cartItemId,
    );
    if (index === -1) return res.status(404).json({ error: "Item not found" });

    if (cart.items[index].qty > 1) {
      cart.items[index].qty -= 1;
    } else {
      cart.items.splice(index, 1);
    }

    cart.total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.qty,
      0,
    );

    // ❌ REMOVE this: don't mark cart deleted here
    // if (cart.items.length === 0) cart.status = "deleted";

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ DELETE ENTIRE ITEM FROM CART (regardless of qty)
router.post("/delete", async (req, res) => {
  const { userId, cartItemId } = req.body;
  if (!userId || !cartItemId)
    return res.status(400).json({ error: "userId and cartItemId required" });

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const index = cart.items.findIndex((item) => item._id.toString() === cartItemId);
    if (index === -1) return res.status(404).json({ error: "Item not found" });

    cart.items.splice(index, 1);
    cart.total = cart.items.reduce((sum, item) => sum + item.product.price * item.qty, 0);

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET CART
router.get("/", async (req, res) => {
  const { userId } = req.query;
  const cart = await Cart.findOne({ userId });
  res.json(cart || { items: [], total: 0, status: "pending" });
});

module.exports = router;
