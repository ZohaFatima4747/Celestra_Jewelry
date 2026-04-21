/**
 * Build-time sitemap generator.
 * Run: node scripts/generate-sitemap.js
 * Called automatically via "build" script in package.json.
 *
 * Fetches live product IDs from the API and writes public/sitemap.xml.
 * Falls back to static-only sitemap if the API is unreachable.
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_URL = "https://celestraa.com";
const API_URL  = process.env.VITE_API_BASE_URL || "https://api.celestraa.com";
const OUT_PATH = resolve(__dirname, "../public/sitemap.xml");

const today = new Date().toISOString().split("T")[0];

const staticPages = [
  { loc: "/",           changefreq: "daily",   priority: "1.0" },
  { loc: "/contact-us", changefreq: "monthly", priority: "0.6" },
];

function urlEntry({ loc, changefreq, priority, lastmod = today }) {
  return `
  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/api/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[sitemap] Could not fetch products: ${err.message}. Using static-only sitemap.`);
    return [];
  }
}

async function generate() {
  const products = await fetchProducts();

  const productEntries = products.map((p) =>
    urlEntry({
      loc: `/product/${p._id}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: p.updatedAt ? p.updatedAt.split("T")[0] : today,
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(urlEntry).join("")}
${productEntries.join("")}
</urlset>
`;

  writeFileSync(OUT_PATH, xml.trim(), "utf-8");
  console.log(`[sitemap] Written ${2 + productEntries.length} URLs → public/sitemap.xml`);
}

generate();
