require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Product = require("./models/Product");

const UPLOADS_DIR = path.join(__dirname, "uploads");

function categorize(url) {
  if (!url || typeof url !== "string" || url.trim() === "") return "invalid";
  if (url.includes("res.cloudinary.com")) return "cloudinary";
  if (url.startsWith("/uploads") || url.startsWith("uploads/")) return "local";
  if (url.startsWith("http://") || url.startsWith("https://")) return "external";
  return "local"; // relative path
}

function localFileExists(url) {
  const filename = url.replace(/^\/uploads\//, "").replace(/^uploads\//, "");
  return fs.existsSync(path.join(UPLOADS_DIR, filename));
}

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI);

  const products = await Product.find({}).lean();

  const report = [];
  const summary = { total: products.length, cloudinary: 0, local_ok: 0, broken: 0, external: 0, invalid: 0 };
  const needsReupload = [];
  const safe = [];

  for (const p of products) {
    const images = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
    const imageDetails = images.map((url) => {
      const type = categorize(url);
      let status = type;

      if (type === "local") {
        status = localFileExists(url) ? "local_ok" : "broken";
      }

      summary[status] = (summary[status] || 0) + 1;
      return { url, status };
    });

    if (images.length === 0) {
      summary.invalid++;
      imageDetails.push({ url: "(none)", status: "invalid" });
    }

    const hasBroken = imageDetails.some((i) => i.status === "broken" || i.status === "invalid");
    const allCloudinary = imageDetails.every((i) => i.status === "cloudinary");

    if (allCloudinary) safe.push(p._id);
    else if (hasBroken) needsReupload.push(p._id);

    report.push({
      id:       String(p._id),
      name:     p.name,
      images:   imageDetails,
    });
  }

  console.log("\n========================================");
  console.log("   CELESTRA JEWELRY — IMAGE AUDIT REPORT");
  console.log("========================================\n");

  console.log("── SUMMARY ──────────────────────────────");
  console.log(`  Total products   : ${summary.total}`);
  console.log(`  Cloudinary ✅    : ${summary.cloudinary}`);
  console.log(`  Local (OK) ⚠️    : ${summary.local_ok}`);
  console.log(`  Broken ❌        : ${summary.broken}`);
  console.log(`  External 🔗      : ${summary.external || 0}`);
  console.log(`  Invalid/Empty ⛔ : ${summary.invalid}`);
  console.log("");

  console.log("── PER-PRODUCT DETAILS ──────────────────");
  for (const p of report) {
    const icons = { cloudinary: "✅", local_ok: "⚠️ ", broken: "❌", external: "🔗", invalid: "⛔" };
    console.log(`\n  [${p.id}] ${p.name}`);
    for (const img of p.images) {
      const icon = icons[img.status] || "?";
      const short = img.url.length > 80 ? img.url.slice(0, 77) + "..." : img.url;
      console.log(`    ${icon} [${img.status.padEnd(10)}] ${short}`);
    }
  }

  console.log("\n── ACTION PLAN ──────────────────────────");
  if (safe.length > 0) {
    console.log(`\n  ✅ SAFE (${safe.length} products) — all images on Cloudinary, no action needed:`);
    safe.forEach((id) => {
      const p = report.find((r) => r.id === String(id));
      console.log(`     • ${p.name} [${id}]`);
    });
  }

  const localOkProducts = report.filter((p) =>
    p.images.some((i) => i.status === "local_ok") && !p.images.some((i) => i.status === "broken")
  );
  if (localOkProducts.length > 0) {
    console.log(`\n  ⚠️  LOCAL FILES EXIST (${localOkProducts.length} products) — re-upload to Cloudinary recommended:`);
    localOkProducts.forEach((p) => console.log(`     • ${p.name} [${p.id}]`));
  }

  if (needsReupload.length > 0) {
    console.log(`\n  ❌ NEEDS RE-UPLOAD (${needsReupload.length} products) — images broken or missing:`);
    needsReupload.forEach((id) => {
      const p = report.find((r) => r.id === String(id));
      console.log(`     • ${p.name} [${id}]`);
    });
  }

  console.log("\n========================================\n");

  await mongoose.disconnect();
}

audit().catch((err) => { console.error("Audit failed:", err.message); process.exit(1); });
