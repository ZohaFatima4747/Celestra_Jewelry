const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { adminAuth } = require("../middleware/auth");
const logger = require("../utils/logger");

const UPLOAD_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer — memory storage so sharp can process ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

// POST /api/upload  (multipart, field name: "images", up to 10 files)
// Generates 3 responsive variants per image: thumb (400px), md (800px), full (1200px)
router.post("/", adminAuth, upload.array("images", 10), async (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ message: "No images provided" });

  try {
    const results = [];

    for (const file of req.files) {
      // Validate it's actually an image
      try {
        await sharp(file.buffer).metadata();
      } catch {
        return res.status(400).json({ message: `Invalid image file: ${file.originalname}` });
      }

      const base = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Generate 3 responsive variants in parallel
      const variants = [
        { suffix: "thumb", width: 400,  quality: 75 },
        { suffix: "md",    width: 800,  quality: 82 },
        { suffix: "full",  width: 1200, quality: 85 },
      ];

      const variantUrls = {};
      await Promise.all(
        variants.map(async ({ suffix, width, quality }) => {
          const filename = `${base}-${suffix}.webp`;
          const dest = path.join(UPLOAD_DIR, filename);
          await sharp(file.buffer)
            .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
            .webp({ quality })
            .toFile(dest);
          variantUrls[suffix] = `/uploads/${filename}`;
        })
      );

      // Primary URL is the full variant (backward-compatible with existing code)
      results.push({
        url:   variantUrls.full,   // primary — stored in product.images[]
        thumb: variantUrls.thumb,
        md:    variantUrls.md,
        full:  variantUrls.full,
      });
    }

    // urls[] keeps backward compat — just the primary URL per image
    res.json({
      success: true,
      urls: results.map((r) => r.url),
      variants: results,
    });
  } catch (err) {
    logger.error({ err }, "[UPLOAD] failed");
    res.status(500).json({ message: "Upload failed. Please try again." });
  }
});

module.exports = router;
