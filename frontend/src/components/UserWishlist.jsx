import React, { useEffect, useState } from "react";
import QuickViewModal from "./QuickViewModal";
import "./UserWishlist.css";

const UserWishlist = ({ isDark = false }) => {
  const [wishlist, setWishlist] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const openQuickView = (product) => setQuickViewProduct(product);
  const closeQuickView = () => setQuickViewProduct(null);

  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1])).id;
    } catch {
      return null;
    }
  };

  const fetchWishlist = async () => {
    const userId = getUserId();
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:1000/api/wishlist/${userId}`);
      const data = await res.json();
      if (data.success) setWishlist(data.wishlist);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const addToCart = async (productId) => {
    const userId = getUserId();
    if (!userId) return alert("Login first");
    try {
      await fetch("http://localhost:1000/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId }),
      });

      // Cart mein add hone ke baad wishlist se remove karo
      await fetch("http://localhost:1000/api/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId }),
      });
      setWishlist((prev) =>
        prev.filter((item) => item.productId._id !== productId),
      );

      alert("Product added to cart!");
    } catch (err) {
      console.error(err);
      alert("Failed to add to cart");
    }
  };

  const removeFromWishlist = async (productId) => {
    const userId = getUserId();
    if (!userId) return alert("Login first");
    try {
      await fetch("http://localhost:1000/api/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId }),
      });
      setWishlist((prev) =>
        prev.filter((item) => item.productId._id !== productId),
      );
    } catch (err) {
      console.error(err);
      alert("Failed to remove");
    }
  };

  return (
    <div className={`uw-wrap ${isDark ? "dark" : "light"}`}>
      {/* Header */}
      <div className="uw-header">
        <div>
          <h3 className="uw-title">My Wishlist</h3>
          <p className="uw-sub">
            {wishlist.length}{" "}
            {wishlist.length === 1 ? "saved item" : "saved items"}
          </p>
        </div>
        {wishlist.length > 0 && (
          <span className="uw-count-badge">{wishlist.length}</span>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="uw-loading">
          <div className="uw-spinner" />
          <p>Loading wishlist...</p>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="uw-empty">
          <span>🤍</span>
          <p>Your wishlist is empty</p>
          <small>Save products you love to find them here</small>
        </div>
      ) : (
        <div className="uw-grid">
          {wishlist.map((item, i) => (
            <div
              className="uw-card"
              key={item.productId._id}
              style={{ animationDelay: `${i * 0.06}s` }}
              onClick={() => openQuickView(item.productId)}
            >
              {/* Image */}
              <div className="uw-card-img">
                <img src={item.productId.image} alt={item.productId.name} />
                <div className="uw-card-overlay">
                  <button
                    className="uw-quick-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openQuickView(item.productId);
                    }}
                  >
                    Quick View
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="uw-card-body">
                <span className="uw-card-cat">{item.productId.category}</span>
                <h4 className="uw-card-name">{item.productId.name}</h4>
                <span className="uw-card-price">
                  Rs {item.productId.price?.toLocaleString()}
                </span>
              </div>

              {/* Actions */}
              <div className="uw-card-actions">
                <button
                  className="uw-btn-cart"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item.productId._id);
                  }}
                >
                  🛒 Add to Cart
                </button>
                <button
                  className="uw-btn-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(item.productId._id);
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={closeQuickView}
          addToCart={addToCart}
          userId={getUserId()}
        />
      )}
    </div>
  );
};

export default UserWishlist;
