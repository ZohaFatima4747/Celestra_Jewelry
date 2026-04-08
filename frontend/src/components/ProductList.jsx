import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "./ProductCard";
import { PROD_URL, getPriceRange } from "../utils/api";
import "./ProductList.css";

// Icon map for known categories; unknown ones get a default gem icon
const CATEGORY_ICONS = {
  all:            "💎",
  rings:          "💍",
  handcuff:       "🔗",
  "hand harness": "🤚",
  earrings:       "✨",
  bracelets:      "🔮",
  chains:         "📿",
};

const SORT_OPTIONS = [
  { key: "default",    label: "Featured" },
  { key: "price-asc",  label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "rating",     label: "Top Rated" },
  { key: "newest",     label: "Newest" },
];

const ProductList = ({ addToCart, searchQuery = "", navCategory = "all", onNavCategoryChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts]             = useState([]);
  const [categories, setCategories]         = useState([{ key: "all", label: "All Jewellery", icon: "💎" }]);
  const [loading, setLoading]               = useState(true);
  const [maxPriceLimit, setMaxPriceLimit]   = useState(Number(searchParams.get("maxPrice") || 20000));

  // Read initial values from URL params, fall back to props/defaults
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || navCategory || "all");
  const [sortBy, setSortBy]                 = useState(searchParams.get("sort") || "default");
  const [priceRange, setPriceRange]         = useState([0, Number(searchParams.get("maxPrice") || 20000)]);
  const [sidebarOpen, setSidebarOpen]       = useState(false);

  // Sync URL params whenever filters change
  useEffect(() => {
    const params = {};
    if (activeCategory !== "all") params.category = activeCategory;
    if (sortBy !== "default")     params.sort      = sortBy;
    if (priceRange[1] !== maxPriceLimit) params.maxPrice = priceRange[1];
    if (searchQuery)              params.search    = searchQuery;
    setSearchParams(params, { replace: true });
  }, [activeCategory, sortBy, priceRange, searchQuery]);

  // Sync navbar category into sidebar (only when navCategory prop changes externally)
  useEffect(() => {
    if (navCategory !== "all") setActiveCategory(navCategory);
  }, [navCategory]);

  useEffect(() => {
    // Fetch products and dynamic price range in parallel
    Promise.all([
      fetch(PROD_URL).then((r) => r.json()),
      getPriceRange(),
    ])
      .then(([data, range]) => {
        setProducts(data);

        // Set dynamic price ceiling (round up to nearest 500 for clean slider)
        const ceiling = Math.ceil((range.max || 20000) / 500) * 500;
        setMaxPriceLimit(ceiling);
        // Only update slider if user hasn't set a custom value via URL
        if (!searchParams.get("maxPrice")) {
          setPriceRange([0, ceiling]);
        }

        // Build dynamic category list from actual products
        const seen = new Set();
        const cats = [{ key: "all", label: "All Jewellery", icon: "💎" }];
        data.forEach((p) => {
          if (p.category && !seen.has(p.category)) {
            seen.add(p.category);
            cats.push({
              key: p.category,
              label: p.category.charAt(0).toUpperCase() + p.category.slice(1),
              icon: CATEGORY_ICONS[p.category] || "🪙",
            });
          }
        });
        setCategories(cats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getCategoryCount = (key) =>
    key === "all" ? products.length : products.filter((p) => p.category === key).length;

  const handleCategoryChange = (key) => {
    setActiveCategory(key);
    onNavCategoryChange?.(key);
    setSidebarOpen(false);
  };

  const filtered = products
    .filter((p) => {
      const matchCat    = activeCategory === "all" || p.category === activeCategory;
      const matchSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchPrice  = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchCat && matchSearch && matchPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc")  return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "rating")     return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "newest")     return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const activeCat = categories.find((c) => c.key === activeCategory);

  return (
    <>
      <div className="featured-header">
        <h2 className="featured-title">Featured <em>pieces</em></h2>
      </div>

      <div className="shop-layout">
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰ Filter & Categories
        </button>

        <aside className={`shop-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-section">
            <h3 className="sidebar-heading">Categories</h3>
            <ul className="category-list">
              {categories.map((cat) => (
                <li key={cat.key}>
                  <button
                    className={`cat-btn ${activeCategory === cat.key ? "active" : ""}`}
                    onClick={() => handleCategoryChange(cat.key)}
                  >
                    <span className="cat-icon">{cat.icon}</span>
                    <span className="cat-label">{cat.label}</span>
                    <span className="cat-count">{getCategoryCount(cat.key)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-heading">Price Range</h3>
            <div className="price-range">
              <div className="price-labels">
                <span>Rs {priceRange[0].toLocaleString()}</span>
                <span>Rs {priceRange[1].toLocaleString()}</span>
              </div>
              <input
                type="range" min="0" max={maxPriceLimit} step="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="price-slider"
              />
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-heading">Quick Stats</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-num">{products.length}</span>
                <span className="stat-lbl">Pieces</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">{categories.length - 1}</span>
                <span className="stat-lbl">Collections</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="shop-main">
          <div className="shop-topbar">
            <div className="topbar-left">
              <h2 className="section-title">
                {activeCategory === "all" ? "All Jewellery" : activeCat?.label}
              </h2>
              <span className="result-count">{filtered.length} pieces</span>
            </div>
            <div className="topbar-right">
              <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {activeCategory !== "all" && (
            <div className="active-filter">
              <span>{activeCat?.icon} {activeCat?.label}</span>
              <button onClick={() => handleCategoryChange("all")}>✕</button>
            </div>
          )}

          {loading ? (
            <div className="loader-container"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span>💎</span>
              <p>No pieces found</p>
              <button onClick={() => { handleCategoryChange("all"); setPriceRange([0, maxPriceLimit]); }}>Clear Filters</button>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map((product, i) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  addToCart={addToCart}
                  animDelay={i * 0.04}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ProductList;
