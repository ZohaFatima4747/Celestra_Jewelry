import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import "./ProductList.css";

const CATEGORIES = [
  { key: "all", label: "All Products", icon: "🏪" },
  { key: "audio", label: "Audio", icon: "🎧" },
  { key: "wearables", label: "Wearables", icon: "⌚" },
  { key: "camera", label: "Camera", icon: "📷" },
  { key: "gadgets", label: "Gadgets", icon: "🕹️" },
  { key: "home", label: "Smart Home", icon: "🏠" },
  { key: "accessories", label: "Accessories", icon: "🖱️" },
];

const SORT_OPTIONS = [
  { key: "default", label: "Featured" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" },
  { key: "newest", label: "Newest" },
];

const ProductList = ({ addToCart, onQuickView, searchQuery = "" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:1000/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Category counts
  const getCategoryCount = (key) => {
    if (key === "all") return products.length;
    return products.filter((p) => p.category === key).length;
  };

  // Filter + Sort
  const filtered = products
    .filter((p) => {
      const matchCat =
        activeCategory === "all" || p.category === activeCategory;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchCat && matchSearch && matchPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  return (
    <div className="shop-layout">
      {/* Mobile sidebar toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰ Filter & Categories
      </button>

      {/* Sidebar */}
      <aside className={`shop-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Categories</h3>
          <ul className="category-list">
            {CATEGORIES.map((cat) => (
              <li key={cat.key}>
                <button
                  className={`cat-btn ${activeCategory === cat.key ? "active" : ""}`}
                  onClick={() => {
                    setActiveCategory(cat.key);
                    setSidebarOpen(false);
                  }}
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
              type="range"
              min="0"
              max="20000"
              step="500"
              value={priceRange[1]}
              onChange={(e) =>
                setPriceRange([priceRange[0], Number(e.target.value)])
              }
              className="price-slider"
            />
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-heading">Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-num">{products.length}</span>
              <span className="stat-lbl">Products</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">{CATEGORIES.length - 1}</span>
              <span className="stat-lbl">Categories</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="shop-main">
        {/* Top Bar */}
        <div className="shop-topbar">
          <div className="topbar-left">
            <h2 className="section-title">
              {activeCategory === "all"
                ? "All Products"
                : CATEGORIES.find((c) => c.key === activeCategory)?.label}
            </h2>
            <span className="result-count">{filtered.length} results</span>
          </div>
          <div className="topbar-right">
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter pill */}
        {activeCategory !== "all" && (
          <div className="active-filter">
            <span>
              {CATEGORIES.find((c) => c.key === activeCategory)?.icon}{" "}
              {CATEGORIES.find((c) => c.key === activeCategory)?.label}
            </span>
            <button onClick={() => setActiveCategory("all")}>✕</button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="loader-container">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span>🔍</span>
            <p>No products found</p>
            <button
              onClick={() => {
                setActiveCategory("all");
                setPriceRange([0, 20000]);
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map((product, i) => (
              <ProductCard
                key={product._id}
                product={product}
                addToCart={addToCart}
                onQuickView={onQuickView}
                animDelay={i * 0.05}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductList;
