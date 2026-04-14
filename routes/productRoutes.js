const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const logger = require("../utils/logger");

// GET /api/products — supports ?category=&search=&minPrice=&maxPrice=&sort=&limit=
router.get("/", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, limit } = req.query;
    const filter = { isActive: { $ne: false } };

    if (category && category !== "all") filter.category = category.toLowerCase();
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ name: re }, { description: re }, { category: re }, { tags: re }];
    }

    let query = Product.find(filter);

    if (sort === "price-asc")       query = query.sort({ price: 1 });
    else if (sort === "price-desc") query = query.sort({ price: -1 });
    else if (sort === "rating")     query = query.sort({ rating: -1 });
    else                            query = query.sort({ createdAt: -1 });

    if (limit) query = query.limit(Number(limit));

    const products = await query.lean();
    res.json(products);
  } catch (err) {
    logger.error({ err }, "GET /products failed");
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/products/categories — must be before /:id
router.get("/categories", async (req, res) => {
  try {
    const cats = await Product.distinct("category", { isActive: { $ne: false } });
    res.json(cats.filter(Boolean).sort());
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/products/price-range — must be before /:id
router.get("/price-range", async (req, res) => {
  try {
    const result = await Product.aggregate([
      { $match: { isActive: { $ne: false } } },
      { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
    ]);
    const { min = 0, max = 20000 } = result[0] || {};
    res.json({ min, max });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
