import React, { useEffect, useState } from "react";
import QuickViewModal from "./QuickViewModal";
import "../App.css"; // make sure loader CSS is included

const UserWishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [loading, setLoading] = useState(false); // loader

  const openQuickView = (product) => setQuickViewProduct(product);
  const closeQuickView = () => setQuickViewProduct(null);

  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      return decoded.id;
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
      alert("Failed to remove from wishlist");
    }
  };

  // --- Render ---
  if (loading)
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );

  if (!loading && wishlist.length === 0)
    return <p style={{ padding: "1rem" }}>Your wishlist is empty.</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h3>
        My Wishlist ({wishlist.length}{" "}
        {wishlist.length === 1 ? "item" : "items"})
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          paddingTop: "1rem",
        }}
      >
        {wishlist.map((item) => (
          <div
            key={item.productId._id}
            className="product-card"
            onClick={() => openQuickView(item.productId)}
            style={{
              width: "200px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              overflow: "hidden",
              cursor: "pointer",
              backgroundColor: "#fff",
              transition: "transform 0.2s",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <img
              src={item.productId.image}
              alt={item.productId.name}
              style={{ width: "100%", height: "200px", objectFit: "cover" }}
            />
            <div style={{ padding: "0.5rem", flexGrow: 1 }}>
              <h4 style={{ fontSize: "1rem", margin: "0 0 0.5rem 0" }}>
                {item.productId.name}
              </h4>
              <p style={{ fontWeight: "bold", margin: 0 }}>
                Rs {item.productId.price}
              </p>
            </div>

            <div
              style={{
                padding: "0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(item.productId._id);
                }}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  backgroundColor: "#007bFF",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Add to Cart
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWishlist(item.productId._id);
                }}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  backgroundColor: "#FF4C4C",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

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
