import { useEffect, useState } from "react";
import QuickViewModal from "./QuickViewModal";
import { getUserId } from "../utils/auth";
import { CART_URL, WISH_URL } from "../utils/api";
import { resolveImage } from "../utils/assetMap";
import api from "../utils/axiosInstance";
import "./UserWishlist.css";

const UserWishlist = ({ isDark = false }) => {
  const [wishlist, setWishlist]           = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [loading, setLoading]             = useState(false);

  const fetchWishlist = async () => {
    const userId = getUserId();
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.get(`${WISH_URL}/${userId}`);
      if (res.data.success) setWishlist(res.data.wishlist);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchWishlist(); }, []);

  const addToCart = async (productId) => {
    const userId = getUserId();
    if (!userId) return alert("Login first");
    try {
      await api.post(`${CART_URL}/add`, { userId, productId });
      await api.post(`${WISH_URL}/toggle`, { userId, productId });
      setWishlist((prev) => prev.filter((item) => item.productId._id !== productId));
      alert("Product added to cart!");
    } catch {
      alert("Failed to add to cart");
    }
  };

  const removeFromWishlist = async (productId) => {
    const userId = getUserId();
    if (!userId) return alert("Login first");
    try {
      await api.post(`${WISH_URL}/toggle`, { userId, productId });
      setWishlist((prev) => prev.filter((item) => item.productId._id !== productId));
    } catch {
      alert("Failed to remove");
    }
  };

  return (
    <div className={`uw-wrap ${isDark ? "dark" : "light"}`}>
      <div className="uw-header">
        <div>
          <h3 className="uw-title">My Wishlist</h3>
          <p className="uw-sub">{wishlist.length} {wishlist.length === 1 ? "saved item" : "saved items"}</p>
        </div>
        {wishlist.length > 0 && <span className="uw-count-badge">{wishlist.length}</span>}
      </div>

      {loading ? (
        <div className="uw-loading"><div className="uw-spinner" /><p>Loading wishlist...</p></div>
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
              onClick={() => setQuickViewProduct(item.productId)}
            >
              <div className="uw-card-img">
                <img src={resolveImage(item.productId.images?.[0])} alt={item.productId.name} />
                <div className="uw-card-overlay">
                  <button className="uw-quick-btn" onClick={(e) => { e.stopPropagation(); setQuickViewProduct(item.productId); }}>
                    Quick View
                  </button>
                </div>
              </div>
              <div className="uw-card-body">
                <span className="uw-card-cat">{item.productId.category}</span>
                <h4 className="uw-card-name">{item.productId.name}</h4>
                <span className="uw-card-price">Rs {item.productId.price?.toLocaleString()}</span>
              </div>
              <div className="uw-card-actions">
                <button className="uw-btn-cart" onClick={(e) => { e.stopPropagation(); addToCart(item.productId._id); }}>
                  🛒 Add to Cart
                </button>
                <button className="uw-btn-remove" onClick={(e) => { e.stopPropagation(); removeFromWishlist(item.productId._id); }}>
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
          onClose={() => setQuickViewProduct(null)}
          addToCart={addToCart}
          userId={getUserId()}
        />
      )}
    </div>
  );
};

export default UserWishlist;
