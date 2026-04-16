import { useState, useEffect } from "react";
import ProductImage from "./ProductImage";
import {
  toggleWishlist as doToggleWishlist,
  isGuestWishlisted,
  fetchUserWishlist,
} from "../utils/wishlist";
import { getUserId } from "../utils/auth";
import "./QuickViewModal.css";

const QuickViewModal = ({ product, onClose, addToCart, userId }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!product) return;
    if (userId) {
      fetchUserWishlist()
        .then((list) => setIsWishlisted(list.some((p) => p.productId._id === product._id)))
        .catch(() => {});
    } else {
      setIsWishlisted(isGuestWishlisted(product._id));
    }
  }, [product?._id, userId]);

  const toggleWishlist = async () => {
    const added = await doToggleWishlist(product._id);
    setIsWishlisted(added);
  };

  if (!product) return null;

  const isOutOfStock = product.stock === 0;

  return (
    <div className="qv-overlay" onClick={onClose}>
      <div className="qv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qv-close" onClick={onClose}>✕</button>

        <div className="qv-img-wrap">
          <ProductImage filename={product.images?.[0]} alt={product.name} eager />
          <button
            className={`qv-wish ${isWishlisted ? "active" : ""}`}
            onClick={toggleWishlist}
            title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
          >
            {isWishlisted ? "❤️" : "🤍"}
          </button>
        </div>

        <div className="qv-info">
          <span className="qv-category">{product.category}</span>
          <h2 className="qv-name">{product.name}</h2>

          {product.rating > 0 && (
            <div className="qv-stars">
              {"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}
              <span className="qv-rating-num">{product.rating.toFixed(1)}</span>
            </div>
          )}

          <p className="qv-desc">{product.description}</p>

          <div className="qv-meta">
            <span className={`qv-stock ${isOutOfStock ? "out" : "in"}`}>
              {isOutOfStock ? "Out of Stock" : "In Stock"}
            </span>
          </div>

          <div className="qv-footer">
            <span className="qv-price">Rs {product.price?.toLocaleString()}</span>
            <button
              className="qv-add-btn"
              onClick={() => { addToCart(product._id); onClose(); }}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? "Sold Out" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
