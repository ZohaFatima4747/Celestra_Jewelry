import React, { useState, useEffect } from "react";
import "./QuickViewModal.css";

const QuickViewModal = ({ product, onClose, addToCart, userId }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!product || !userId) return;

    fetch(`http://localhost:1000/api/wishlist/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const exists = data.wishlist.some(
            (p) => p.productId._id === product._id,
          );
          setIsWishlisted(exists);
        }
      });
  }, [product, userId]);

  const toggleWishlist = () => {
    if (!userId) {
      alert("Login first");
      return;
    }

    fetch("http://localhost:1000/api/wishlist/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        productId: product._id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsWishlisted(!isWishlisted);
        }
      });
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - left) / width - 0.5) * 20;
    const y = ((e.clientY - top) / height - 0.5) * -20;

    setRotation({ x, y });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  if (!product) return null;

  return (
    <div className="quickview-overlay" onClick={onClose}>
      <div className="quickview-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <div
          className="quickview-img-container"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <img
            src={product.image}
            alt={product.name}
            className="quickview-img"
            style={{
              transform: `rotateY(${rotation.x}deg) rotateX(${rotation.y}deg)`,
            }}
          />
        </div>

        {/* ❤️ WISHLIST BUTTON */}
        {/* ❤️ WISHLIST BUTTON */}
        <div className="wishlist-btn-wrap" onClick={toggleWishlist}>
          <span className="wishlist-icon">{isWishlisted ? "❤️" : "🤍"}</span>
          <span className="wishlist-tooltip">
            {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          </span>
        </div>

        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <p>Stock: IN STOCK</p>
        <p>Price: Rs {product.price}</p>

        <button onClick={() => addToCart(product._id)}>Add to Cart</button>
      </div>
    </div>
  );
};

export default QuickViewModal;
