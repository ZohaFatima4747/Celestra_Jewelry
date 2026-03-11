import React, { useState, useEffect, useRef } from "react";
import "./Navbar.css";
import { useNavigate } from "react-router-dom";

const Navbar = ({ cartCount, onCartOpen, searchQuery, onSearchChange }) => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const searchRef = useRef(null);

  // Fetch all products once
  useEffect(() => {
    fetch("http://localhost:1000/api/products")
      .then((r) => r.json())
      .then((data) => setAllProducts(data))
      .catch(() => {});
  }, []);

  // Filter suggestions on query change
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      setShowDrop(false);
      return;
    }

    const filtered = allProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      )
      .slice(0, 6);

    setSuggestions(filtered);
    setShowDrop(filtered.length > 0);
  }, [searchQuery, allProducts]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (product) => {
    onSearchChange(product.name);
    setShowDrop(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate("/shop")}>
          <span className="logo-icon">⚡</span>
          <span className="logo-text">Grace</span>
          <span className="logo-sub">Electronics</span>
        </div>

        {/* Search Bar */}
        <div className="navbar-search" ref={searchRef}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDrop(true)}
          />

          {/* Suggestions Dropdown */}
          {showDrop && (
            <div className="search-dropdown">
              {suggestions.map((product) => (
                <div
                  key={product._id}
                  className="search-item"
                  onMouseDown={() => handleSelect(product)}
                >
                  <div className="search-item-img">
                    <img src={product.image} alt={product.name} />
                  </div>
                  <div className="search-item-info">
                    <span className="search-item-name">{product.name}</span>
                    <span className="search-item-meta">
                      <span className="search-item-cat">
                        {product.category}
                      </span>
                      <span className="search-item-price">
                        Rs {product.price?.toLocaleString()}
                      </span>
                    </span>
                  </div>
                </div>
              ))}

              {/* Clear button */}
              {searchQuery && (
                <div
                  className="search-clear"
                  onMouseDown={() => {
                    onSearchChange("");
                    setShowDrop(false);
                  }}
                >
                  ✕ Clear search
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="navbar-actions">
          <button
            className="nav-icon-btn"
            onClick={() => navigate("/admin")}
            title="Dashboard"
          >
            <i className="fa-solid fa-user"></i>
          </button>

          <button className="nav-cart-btn" onClick={onCartOpen}>
            <span className="cart-icon">🛒</span>
            <span className="cart-label">Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          <button className="nav-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
