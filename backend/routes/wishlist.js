const express = require("express");
const router  = express.Router();
const Wishlist = require("../models/Wishlist");
const { authMiddleware } = require("../middleware/auth");

// ── helpers ───────────────────────────────────────────────────────────────────
const getOrCreate = async (userId) => {
  let wl = await Wishlist.findOne({ userId });
  if (!wl) wl = await Wishlist.create({ userId, products: [] });
  return wl;
};

// ── POST /api/wishlist/add  (logged-in) ───────────────────────────────────────
// Body: { productId }  — toggles add/remove
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, error: "productId required" });

    const wl  = await getOrCreate(req.user.id);
    const idx = wl.products.findIndex((p) => p.productId.toString() === productId);
    if (idx > -1) wl.products.splice(idx, 1);
    else          wl.products.push({ productId });

    await wl.save();
    res.json({ success: true, added: idx === -1 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/wishlist  (logged-in) ────────────────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const wl = await Wishlist.findOne({ userId: req.user.id })
      .populate("products.productId", "name images price category stock");
    res.json({ success: true, wishlist: wl?.products || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/wishlist/merge  (logged-in) ─────────────────────────────────────
// Body: { guestWishlist: ["productId1", "productId2", ...] }
// Merges guest IDs into user wishlist (deduplicates with Set)
router.post("/merge", authMiddleware, async (req, res) => {
  try {
    const { guestWishlist = [] } = req.body;
    if (!guestWishlist.length) return res.json({ success: true });

    const wl       = await getOrCreate(req.user.id);
    const existing = new Set(wl.products.map((p) => p.productId.toString()));

    guestWishlist.forEach((id) => {
      if (!existing.has(id)) {
        wl.products.push({ productId: id });
        existing.add(id);
      }
    });

    await wl.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/wishlist/toggle  (legacy — kept for backward compat) ────────────
router.post("/toggle", async (req, res) => {
  const { userId, productId } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: "userId required" });
  try {
    const wl  = await getOrCreate(userId);
    const idx = wl.products.findIndex((p) => p.productId.toString() === productId);
    if (idx > -1) wl.products.splice(idx, 1);
    else          wl.products.push({ productId });
    await wl.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/wishlist/:userId  (legacy — kept for backward compat) ────────────
router.get("/:userId", async (req, res) => {
  try {
    const wl = await Wishlist.findOne({ userId: req.params.userId })
      .populate("products.productId", "name images price category stock");
    res.json({ success: true, wishlist: wl?.products || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
