const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const logger = require("../utils/logger");

// POST /api/upload  (multipart, field name: "images", up to 10 files)
router.post("/", adminAuth, upload.array("images", 10), async (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ message: "No images provided" });

  try {
    const urls = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer))
    );

    res.json({ success: true, urls });
  } catch (err) {
    logger.error({ err }, "[UPLOAD] Cloudinary upload failed");
    res.status(500).json({ message: "Image upload failed. Please try again." });
  }
});

module.exports = router;
