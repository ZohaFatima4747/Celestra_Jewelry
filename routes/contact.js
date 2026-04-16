const router = require("express").Router();
const Contact = require("../models/contact");
const Login = require("../models/login");
const Cart = require("../models/Cart");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../middleware/auth");
const logger = require("../utils/logger");

// ── CHECK if email belongs to a guest account ─────────────────────────────────
router.get("/check-guest", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email required" });
    const user = await Contact.findOne({ email });
    if (!user) return res.status(200).json({ isGuest: false, exists: false });
    return res.status(200).json({ isGuest: user.isGuest, exists: true, name: user.name });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GUEST — create or update guest record ─────────────────────────────────────
router.post("/guest", async (req, res) => {
  try {
    const { name, email, phone, province, city, address } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    const guestName = name?.trim() || email.split("@")[0];

    let user = await Contact.findOne({ email });
    if (user && !user.isGuest) return res.status(200).json({ message: "account_exists" });

    if (!user) {
      user = new Contact({
        name: guestName, email,
        phone: phone || null, province: province || null,
        city: city || null, address: address || null,
        isGuest: true, password: null,
      });
      await user.save();
    } else {
      user.name     = guestName;
      user.phone    = phone    || user.phone;
      user.province = province || user.province;
      user.city     = city     || user.city;
      user.address  = address  || user.address;
      await user.save();
    }

    return res.status(200).json({ message: "guest_saved", guestId: user._id });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ── Helper: merge guest cart into user cart ───────────────────────────────────
const mergeGuestCart = async (userId, guestCart) => {
  if (!guestCart?.length) return;
  let cart = await Cart.findOne({ userId });
  if (!cart || cart.status === "completed") {
    cart = new Cart({ userId, items: [], total: 0, status: "pending" });
  }
  guestCart.forEach((item) => {
    const product = item.product;
    if (!product?._id) return;
    const idx = cart.items.findIndex(
      (c) => c.product._id?.toString() === product._id.toString()
    );
    if (idx > -1) cart.items[idx].qty += item.qty;
    else cart.items.push({ product, qty: item.qty });
  });
  cart.total = cart.items.reduce((sum, i) => sum + (i.product.price || 0) * i.qty, 0);
  await cart.save();
};

// ── SIGNUP ────────────────────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, guestCart } = req.body;
    const existing = await Contact.findOne({ email });

    if (existing && !existing.isGuest)
      return res.status(400).json({ message: "Email already exists", action: "LOGIN_SUGGEST" });

    const hashed = await bcrypt.hash(password, 10);
    let user;

    if (existing?.isGuest) {
      existing.password = hashed;
      existing.name = name || existing.name;
      existing.isGuest = false;
      await existing.save();
      user = existing;
    } else {
      user = await Contact.create({ name, email, password: hashed });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await mergeGuestCart(user._id, guestCart);
    res.status(200).json({ message: "Signup successful", token, userId: user._id });
  } catch {
    res.status(500).json({ message: "Error signing up" });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password, guestCart } = req.body;
    const user = await Contact.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid email or password" });
    if (user.isGuest || !user.password)
      return res.status(400).json({ message: "Please set your password first. Use the Sign Up form." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Remove any stale login sessions for this user before creating a new one
    await Login.deleteMany({ userId: user._id });
    await Login.create({ userId: user._id, token, refreshToken, name: user.name || user.email, email: user.email, role: user.role });
    await mergeGuestCart(user._id, guestCart);

    res.status(200).json({ message: "Login successful", token, refreshToken, userId: user._id });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ message: "Server error" });
  }
});

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const record = await Login.findOne({ userId: decoded.id, refreshToken });
    if (!record) return res.status(403).json({ message: "Invalid refresh token" });

    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(200).json({ token: newToken });
  } catch {
    res.status(403).json({ message: "Refresh token expired or invalid" });
  }
});

// ── GET ALL USERS (admin only) ────────────────────────────────────────────────
router.get("/all", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied. Admin only" });
    const users = await Contact.find({});
    res.status(200).json(users);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET USER BY ID ────────────────────────────────────────────────────────────
router.get("/user/:id", authMiddleware, async (req, res) => {
  try {
    const user = await Contact.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ name: user.name, email: user.email, role: user.role });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ── UPDATE USER BY ID ─────────────────────────────────────────────────────────
router.put("/user/:id", authMiddleware, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updated = await Contact.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User updated successfully", user: updated });
  } catch (err) {
    logger.error({ err }, "Update user error");
    res.status(500).json({ message: "Server error" });
  }
});

// ── DELETE USER BY ID ─────────────────────────────────────────────────────────
router.delete("/user/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Contact.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
