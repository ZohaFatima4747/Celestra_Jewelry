import React from "react";
import "./ProductCard.css";

const StarRating = ({ rating = 0 }) => {
  const stars = [];
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push("★");
    else if (i === full && half) stars.push("½");
    else stars.push("☆");
  }
  return (
    <div className="star-row">
      <span className="stars">
        {stars.map((s, i) => (
          <span key={i} className={s !== "☆" ? "star filled" : "star"}>
            {s === "½" ? "★" : s}
          </span>
        ))}
      </span>
      {rating > 0 && <span className="rating-num">{rating.toFixed(1)}</span>}
    </div>
  );
};

const ProductCard = ({ product, addToCart, onQuickView, animDelay = 0 }) => {
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="pc-card" style={{ animationDelay: `${animDelay}s` }}>
      {/* Badge */}
      {isOutOfStock && <span className="pc-badge out">Out of Stock</span>}
      {isLowStock && !isOutOfStock && (
        <span className="pc-badge low">Only {product.stock} left</span>
      )}
      {!isLowStock && !isOutOfStock && product.stock > 0 && (
        <span className="pc-badge in">In Stock</span>
      )}

      {/* Image */}
      <div className="pc-img-box" onClick={() => onQuickView(product)}>
        <img src={product.image} alt={product.name} loading="lazy" />
        <div className="pc-img-overlay">
          <span>Quick View</span>
        </div>
      </div>

      {/* Content */}
      <div className="pc-content">
        <span className="pc-category">{product.category}</span>
        <h3 className="pc-name">{product.name}</h3>

        {product.rating > 0 && <StarRating rating={product.rating} />}

        <div className="pc-footer">
          <span className="pc-price">Rs {product.price.toLocaleString()}</span>
          <div className="pc-actions">
            <button
              className="pc-btn solid"
              onClick={() => addToCart(product._id)}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? "Sold Out" : "+ Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
