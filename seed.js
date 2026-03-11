const Product = require('./models/Product');
const connectDB = require('./conn/connection');

const products = [
  // ── AUDIO ──────────────────────────────────────────────
  {
    name: "Grace Wireless Earbuds Pro",
    description: "Active noise cancellation, 30hr battery, IPX5 waterproof with premium sound drivers.",
    price: 4999,
    image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=870&auto=format&fit=crop",
    category: "audio", stock: 45, rating: 4.5, numReviews: 128,
  },
  {
    name: "Grace Bluetooth Speaker X",
    description: "360° surround sound, 24hr battery, IPX7 waterproof, deep bass radiator.",
    price: 3499,
    image: "https://images.unsplash.com/photo-1547052178-7f2c5a20c332?w=870&auto=format&fit=crop",
    category: "audio", stock: 30, rating: 4.2, numReviews: 95,
  },
  {
    name: "Grace Studio Headphones",
    description: "Over-ear 40mm drivers, foldable design, 32hr playtime, studio-grade clarity.",
    price: 6499,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=870&auto=format&fit=crop",
    category: "audio", stock: 20, rating: 4.7, numReviews: 74,
  },
  {
    name: "Grace Neckband Pro",
    description: "Magnetic neckband, 20hr playback, fast charge 10min = 3hr, deep bass.",
    price: 1999,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=870&auto=format&fit=crop",
    category: "audio", stock: 60, rating: 4.0, numReviews: 53,
  },

  // ── WEARABLES ───────────────────────────────────────────
  {
    name: "Grace Smartwatch X10",
    description: "AMOLED display, heart rate monitor, GPS, SpO2, 7-day battery.",
    price: 7999,
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=872&auto=format&fit=crop",
    category: "wearables", stock: 35, rating: 4.6, numReviews: 210,
  },
  {
    name: "Grace Fitness Band Pro",
    description: "Sleep tracking, SpO2, 14-day battery, lightweight waterproof design.",
    price: 2999,
    image: "https://images.unsplash.com/photo-1758348844319-6ca57f0a8ea0?w=870&auto=format&fit=crop",
    category: "wearables", stock: 50, rating: 4.1, numReviews: 88,
  },
  {
    name: "Grace Smart Glasses AR",
    description: "Augmented reality HUD, notifications, UV400 protection, 8hr battery.",
    price: 17999,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=580&auto=format&fit=crop",
    category: "wearables", stock: 8, rating: 3.9, numReviews: 41,
  },
  {
    name: "Grace Kids Smartwatch",
    description: "GPS tracking, SOS button, calling, games, waterproof kids-safe design.",
    price: 3999,
    image: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=870&auto=format&fit=crop",
    category: "wearables", stock: 25, rating: 4.3, numReviews: 67,
  },

  // ── CAMERA ──────────────────────────────────────────────
  {
    name: "Grace 4K Action Camera",
    description: "Waterproof 4K/60fps, 170° wide-angle, EIS stabilization, WiFi.",
    price: 9999,
    image: "https://images.unsplash.com/photo-1616088886430-ccd86fef0713?w=870&auto=format&fit=crop",
    category: "camera", stock: 25, rating: 4.4, numReviews: 115,
  },
  {
    name: "Grace Vlog Camera Mini",
    description: "4K vlogging, flip touchscreen, built-in ND filter, compact body.",
    price: 13999,
    image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=870&auto=format&fit=crop",
    category: "camera", stock: 15, rating: 4.3, numReviews: 62,
  },
  {
    name: "Grace 360 Camera",
    description: "360° capture, 5.7K resolution, waterproof to 10m, flow state stabilization.",
    price: 16999,
    image: "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "camera", stock: 10, rating: 4.5, numReviews: 38,
  },

  // ── GADGETS ─────────────────────────────────────────────
  {
    name: "Grace VR Headset Pro",
    description: "110° FOV, 4K per-eye display, built-in speakers, 3hr battery.",
    price: 14999,
    image: "https://images.unsplash.com/photo-1491927570842-0261e477d937?w=870&auto=format&fit=crop",
    category: "gadgets", stock: 18, rating: 4.2, numReviews: 79,
  },
  {
    name: "Grace Drone Mini X",
    description: "Foldable, HD camera, 25min flight, auto-hover, beginner-friendly.",
    price: 12999,
    image: "https://images.unsplash.com/photo-1581136106157-08c372e6774d?w=870&auto=format&fit=crop",
    category: "gadgets", stock: 12, rating: 4.0, numReviews: 56,
  },
  {
    name: "Grace Pocket Projector",
    description: "100 ANSI lumens, HDMI + USB-C, built-in 5W speaker, 2hr battery.",
    price: 8999,
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=870&auto=format&fit=crop",
    category: "gadgets", stock: 22, rating: 4.1, numReviews: 47,
  },
  {
    name: "Grace E-Reader Lite",
    description: "6\" e-ink display, 8 weeks battery, waterproof, 8GB storage, warm light.",
    price: 5499,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=870&auto=format&fit=crop",
    category: "gadgets", stock: 30, rating: 4.4, numReviews: 92,
  },

  // ── HOME ────────────────────────────────────────────────
  {
    name: "Grace Smart Home Hub",
    description: "Controls 100+ smart devices, voice assistant, WiFi+Zigbee+BT.",
    price: 5999,
    image: "https://images.unsplash.com/photo-1752262167753-37a0ec83f614?w=870&auto=format&fit=crop",
    category: "home", stock: 28, rating: 4.3, numReviews: 93,
  },
  {
    name: "Grace Smart LED Bulbs (4-Pack)",
    description: "16M colors, app + voice control, schedules, 10,000hr lifespan.",
    price: 2499,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=870&auto=format&fit=crop",
    category: "home", stock: 70, rating: 4.4, numReviews: 132,
  },
  {
    name: "Grace Robot Vacuum Max",
    description: "Smart mapping, auto-empty base, mop combo, 3hr runtime.",
    price: 19999,
    image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=870&auto=format&fit=crop",
    category: "home", stock: 5, rating: 4.6, numReviews: 67,
  },
  {
    name: "Grace Smart Security Camera",
    description: "2K resolution, night vision, AI motion detection, 2-way audio.",
    price: 4499,
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=870&auto=format&fit=crop",
    category: "home", stock: 40, rating: 4.2, numReviews: 85,
  },

  // ── ACCESSORIES ─────────────────────────────────────────
  {
    name: "Grace Wireless Charging Pad 15W",
    description: "15W fast Qi charging, LED indicator, non-slip surface, universal.",
    price: 1999,
    image: "https://images.unsplash.com/photo-1543472750-506bacbf5808?w=870&auto=format&fit=crop",
    category: "accessories", stock: 80, rating: 4.2, numReviews: 176,
  },
  {
    name: "Grace Gaming Mouse RGB",
    description: "12000 DPI optical, 7 programmable buttons, RGB, ergonomic grip.",
    price: 2499,
    image: "https://images.unsplash.com/photo-1649425371500-19385ad5f7d1?w=870&auto=format&fit=crop",
    category: "accessories", stock: 40, rating: 4.5, numReviews: 143,
  },
  {
    name: "Grace Mechanical Keyboard TKL",
    description: "Blue switches, per-key RGB, USB-C, anti-ghosting, compact TKL layout.",
    price: 5999,
    image: "https://media.istockphoto.com/id/153065264/photo/computer-keyboard-with-clipping-path.jpg?s=2048x2048&w=is&k=20&c=fupVNsbHkh_M9tu5pJvWH05Biymi0jhBADR7waWKo5w=",
    category: "accessories", stock: 33, rating: 4.6, numReviews: 98,
  },
  {
    name: "Grace USB-C Hub 7-in-1",
    description: "4K HDMI, 100W PD pass-through, SD/microSD, 3× USB-A ports.",
    price: 3299,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=870&auto=format&fit=crop",
    category: "accessories", stock: 55, rating: 4.3, numReviews: 84,
  },
  {
    name: "Grace Laptop Stand Aluminum",
    description: "6 height levels, foldable, non-slip pads, supports up to 15kg.",
    price: 1799,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=870&auto=format&fit=crop",
    category: "accessories", stock: 65, rating: 4.4, numReviews: 119,
  },
];

const seedDB = async () => {
  try {
    await connectDB();
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`✔ ${products.length} Products seeded successfully!`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();