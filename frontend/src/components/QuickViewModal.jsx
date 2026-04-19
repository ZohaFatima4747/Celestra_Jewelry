import { useState } from "react";
import ProductImage from "./ProductImage";
import "./QuickViewModal.css";

const QuickViewModal = ({ product, onClose, addToCart }) => {
  const [selectedSize,  setSelectedSize]  = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [qty,           setQty]           = useState(1);
  const [cartMsg,       setCartMsg]       = useState("");

  if (!product) return null;

  const isOutOfStock = product.stock === 0;
  const gallery      = product.images?.length ? product.images : [];

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      setCartMsg("Please select a size first");
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      setCartMsg("Please select a color first");
      return;
    }
    addToCart(product._id, product, qty, selectedSize, selectedColor);
    setCartMsg("Added to cart!");
    setTimeout(() => { setCartMsg(""); onClose(); }, 1200);
  };

  return (
    <div className="qv-overlay" onClick={onClose}>
      <div className="qv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qv-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Image pane */}
        <div className="qv-img-wrap">
          <ProductImage filename={gallery[0]} alt={product.name} eager />
          {isOutOfStock && <div className="qv-sold-badge">Sold Out</div>}
        </div>

        {/* Info pane */}
        <div className="qv-info">
          <span className="qv-category">{product.category}</span>
          <h2 className="qv-name">{product.name}</h2>

          {product.rating > 0 && (
            <div className="qv-stars">
              {"★".repeat(Math.round(product.rating))}
              {"☆".repeat(5 - Math.round(product.rating))}
              <span className="qv-rating-num">{product.rating.toFixed(1)}</span>
              {product.numReviews > 0 && (
                <span className="qv-review-count">({product.numReviews})</span>
              )}
            </div>
          )}

          <div className="qv-price-row">
            <span className="qv-price">Rs {product.price?.toLocaleString()}</span>
            <span className={`qv-stock-tag ${isOutOfStock ? "out" : "in"}`}>
              {isOutOfStock ? "Out of Stock" : `In Stock (${product.stock})`}
            </span>
          </div>

          <div className="qv-divider" />

          {product.description && (
            <p className="qv-desc">{product.description}</p>
          )}

          {/* Color selector */}
          {product.colors?.length > 0 && (
            <div className="qv-option-group">
              <div className="qv-option-label">
                Color: <span className="qv-option-val">{selectedColor || "Select"}</span>
              </div>
              <div className="qv-options">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    className={`qv-opt-btn ${selectedColor === c ? "active" : ""}`}
                    onClick={() => setSelectedColor(c)}
                  >{c}</button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {product.sizes?.length > 0 && (
            <div className="qv-option-group">
              <div className="qv-option-label">
                Size: <span className="qv-option-val">{selectedSize || "Select"}</span>
              </div>
              <div className="qv-options">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    className={`qv-opt-btn ${selectedSize === s ? "active" : ""}`}
                    onClick={() => setSelectedSize(s)}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div className="qv-option-group">
            <div className="qv-option-label">Quantity:</div>
            <div className="qv-qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
          </div>

          {cartMsg && (
            <div className={`qv-cart-msg ${cartMsg.startsWith("Please") ? "qv-cart-msg--error" : ""}`}>
              {cartMsg}
            </div>
          )}

          <div className="qv-footer">
            <button
              className="qv-add-btn"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? "Sold Out" : "Add to Cart"}
            </button>
          </div>

          <div className="qv-trust">
            <span>✦ Free gift wrapping</span>
            <span>✦ Free nationwide delivery</span>
            <span>✦ Easy 30-day returns</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
