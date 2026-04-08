const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist");

// Add / Remove product from wishlist
router.post("/toggle", async (req, res) => {
  const { userId, productId } = req.body;
  if (!userId)
    return res.status(400).json({ success: false, error: "User required" });

  try {
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    // Toggle product
    const index = wishlist.products.findIndex(
      (p) => p.productId.toString() === productId,
    );
    if (index >= 0)
      wishlist.products.splice(index, 1); // remove
    else wishlist.products.push({ productId }); // add

    await wishlist.save();
    res.json({ success: true, wishlist });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get a single user wishlist
router.get("/:userId", async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      userId: req.params.userId,
    }).populate("products.productId", "name images price category stock");
    res.json({ success: true, wishlist: wishlist?.products || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Admin route: get all users' wishlists
router.get("/admin/all", async (req, res) => {
  try {
    const wishlists = await Wishlist.find()
      .populate("userId", "name email") // populate user info
      .populate("products.productId", "name images price category stock"); // populate product info

    res.json({ success: true, wishlists });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
