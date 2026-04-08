import React from "react";
import { useNavigate } from "react-router-dom";
import ProductImage from "./ProductImage";
import "./ProductCard.css";

const StarRating = ({ rating = 0 }) => {
  const full = Math.floor(rating);
  return (
    <div className="star-row">
      <span className="stars">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < full ? "star filled" : "star"}>★</span>
        ))}
      </span>
      {rating > 0 && <span className="rating-num">{rating.toFixed(1)}</span>}
    </div>
  );
};

const ProductCard = ({ product, addToCart, animDelay = 0 }) => {
  const navigate = useNavigate();
  const isLowStock   = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="pc-card" style={{ animationDelay: `${animDelay}s` }}>
      {isOutOfStock  && <span className="pc-badge out">Out of Stock</span>}
      {isLowStock && !isOutOfStock && <span className="pc-badge low">Only {product.stock} left</span>}
      {!isLowStock && !isOutOfStock && <span className="pc-badge in">In Stock</span>}

      <div className="pc-img-box" onClick={() => navigate(`/product/${product._id}`)}>
        {/* aspect-ratio: 1/1 set on .pc-img-box in CSS — no layout shift */}
        <ProductImage filename={product.images?.[0]} alt={product.name} />
        <div className="pc-img-overlay"><span>View Details</span></div>
      </div>

      <div className="pc-content">
        <span className="pc-category">{product.category}</span>
        <h3 className="pc-name" onClick={() => navigate(`/product/${product._id}`)}>{product.name}</h3>
        {product.rating > 0 && <StarRating rating={product.rating} />}
        <div className="pc-footer">
          <span className="pc-price">Rs {product.price.toLocaleString()}</span>
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
  );
};

export default ProductCard;
