import { useState, useEffect, useRef } from "react";
import "./Navbar.css";
import { useNavigate } from "react-router-dom";
import ContactForm from "./ContactForm";
import CelestraLogo from "./CelestraLogo";
import ProductImage from "./ProductImage";
import { PROD_URL } from "../utils/api";
import { useCart } from "../context/CartContext";

const Navbar = ({ cartCount, onCartOpen, searchQuery, onSearchChange }) => {
  const navigate = useNavigate();
  const { setCartItems } = useCart();
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    fetch(PROD_URL)
      .then((r) => r.json())
      .then((data) => setAllProducts(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) { setSuggestions([]); setShowDrop(false); return; }
    const filtered = allProducts
      .filter((p) => p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
      .slice(0, 6);
    setSuggestions(filtered);
    setShowDrop(filtered.length > 0);
  }, [searchQuery, allProducts]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (product) => { onSearchChange(product.name); setShowDrop(false); };

  return (
    <>
      {/* Topbar */}
      <div className="navbar-announce">
        <span className="navbar-announce-center">Luxury jewelry for every occasion &nbsp;·&nbsp; Free delivery across Pakistan &nbsp;·&nbsp; Celestra Jewelry</span>
        <div className="navbar-announce-right">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/contact-us"); }}>Contact</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Visit Store</a>
        </div>
      </div>

      <nav className="navbar">
        <div className="navbar-inner">

          {/* Center logo */}
          <div className="navbar-logo">
            <CelestraLogo size="navbar" onClick={() => navigate("/")} />
          </div>

          {/* Right: search + profile + cart */}
          <div className="navbar-actions">
            <div className="navbar-search" ref={searchRef}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search jewelry..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowDrop(true)}
              />
              {showDrop && (
                <div className="search-dropdown">
                  {suggestions.map((product) => (
                    <div key={product._id} className="search-item" onMouseDown={() => handleSelect(product)}>
                      <div className="search-item-img">
                        <ProductImage filename={product.images?.[0]} alt={product.name} />
                      </div>
                      <div className="search-item-info">
                        <span className="search-item-name">{product.name}</span>
                        <span className="search-item-meta">
                          <span className="search-item-cat">{product.category}</span>
                          <span className="search-item-price">Rs {product.price?.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                  {searchQuery && (
                    <div className="search-clear" onMouseDown={() => { onSearchChange(""); setShowDrop(false); }}>✕ Clear</div>
                  )}
                </div>
              )}
            </div>

            <button className="nav-icon-btn" onClick={() => setShowContactForm(true)} title="Account">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"/></svg>
            </button>

            <button className="nav-cart-btn" onClick={onCartOpen}>
              <span className="cart-icon">🛒</span>
              <span className="cart-label">Cart ({cartCount})</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {showContactForm && (
        <div className="cf-overlay" onClick={() => setShowContactForm(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <ContactForm onClose={() => setShowContactForm(false)} setCartItems={setCartItems} />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
