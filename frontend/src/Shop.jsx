import React, { useEffect, useState, useRef } from "react";
import BannerSlider from "./components/BannerSlider";
import Navbar from "./components/Navbar";
import ProductList from "./components/ProductList";
import CartModal from "./components/CartModal";
import QuickViewModal from "./components/QuickViewModal";
import "./App.css";
import StripePayment from "./components/StripePayment";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  "pk_test_51Rpnd4GaJ8id7jyS1lh9GxEBfZivIVY3dHpUvvbbXh7KpRmadYpqSkXm3MaHEVCoYekFwgpAaJu6jik4S45HWzSi00lPtxtpFm",
);

function Shop() {
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [wishlistedIds, setWishlistedIds] = useState([]);

  const productRef = useRef(null); // ← Shop Now scroll ref

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

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

  const fetchCart = () => {
    const userId = getUserId();
    if (!userId) return;
    fetch(`http://localhost:1000/api/cart?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setCartItems(data.items || []))
      .catch(console.error);
  };

  const fetchWishlist = () => {
    const userId = getUserId();
    if (!userId) return;
    fetch(`http://localhost:1000/api/wishlist/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWishlistedIds(data.wishlist.map((item) => item.productId._id));
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCart();
    fetchWishlist();
  }, []);

  const addToCart = (productId) => {
    const userId = getUserId();
    if (!userId) return alert("Login first");
    fetch("http://localhost:1000/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId }),
    }).then(() => fetchCart());
  };

  const removeItem = (cartItemId) => {
    const userId = getUserId();
    if (!userId) return;
    fetch("http://localhost:1000/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cartItemId }),
    }).then(() => fetchCart());
  };

  const increaseQty = (cartItemId) => {
    const userId = getUserId();
    if (!userId) return;
    const productId = cartItems.find((i) => i._id === cartItemId)?.product._id;
    if (!productId) return;
    fetch("http://localhost:1000/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId }),
    }).then(() => fetchCart());
  };

  const handleWishlistToggle = (productId, isNowWishlisted) => {
    if (isNowWishlisted) {
      setWishlistedIds((prev) => [...prev, productId]);
    } else {
      setWishlistedIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const handleCheckoutClick = () => setShowPayment(true);
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0,
  );

  return (
    <div className="shop-wrapper">
      <Navbar
        cartCount={cartItems.length}
        onCartOpen={() => setCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Shop Now button scroll handler pass karo */}
      <BannerSlider
        onShopNow={() =>
          productRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      />

      {/* ref wrap karo ProductList ke around */}
      <div ref={productRef}>
        <ProductList
          addToCart={addToCart}
          onQuickView={openQuickView}
          searchQuery={searchQuery}
        />
      </div>

      {cartOpen && (
        <CartModal
          cartItems={cartItems}
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckoutClick}
          removeItem={removeItem}
          increaseQty={increaseQty}
        />
      )}

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={closeQuickView}
          addToCart={addToCart}
          userId={getUserId()}
          wishlistedIds={wishlistedIds}
          onWishlistToggle={handleWishlistToggle}
        />
      )}

      {showPayment && (
        <div className="payment-overlay">
          <div className="payment-popup">
            <button className="close-btn" onClick={() => setShowPayment(false)}>
              ✕
            </button>
            <h2 className="heading">Checkout</h2>
            <div className="user-details-form">
              <h3>Full Name:</h3>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <h3>Email:</h3>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <h3>Phone Number:</h3>
              <input
                type="text"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <h3>Address:</h3>
              <textarea
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Elements stripe={stripePromise}>
              <StripePayment
                amount={totalAmount}
                onSuccess={async (paymentIntentId) => {
                  const userId = getUserId();
                  if (!userId) return alert("Login first");
                  const res = await fetch(
                    "http://localhost:1000/api/orders/complete-payment",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId,
                        paymentIntentId,
                        customer: { name, email, phone, address },
                        items: cartItems.map((i) => ({
                          productId: i.product._id,
                          name: i.product.name,
                          price: i.product.price,
                          qty: i.qty,
                        })),
                        total: totalAmount,
                      }),
                    },
                  );
                  const result = await res.json();
                  if (result.success) {
                    setCartItems([]);
                    setShowPayment(false);
                    setCartOpen(false);
                    alert("Payment successful!");
                  } else alert("Payment failed: " + result.error);
                }}
              />
            </Elements>
            <button
              className="cod-btn"
              onClick={async () => {
                const userId = getUserId();
                if (!userId) return alert("Login first");
                const res = await fetch(
                  "http://localhost:1000/api/orders/complete-payment",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId,
                      paymentIntentId: "COD",
                      customer: { name, email, phone, address },
                      items: cartItems.map((i) => ({
                        productId: i.product._id,
                        name: i.product.name,
                        price: i.product.price,
                        qty: i.qty,
                      })),
                      total: totalAmount,
                    }),
                  },
                );
                const result = await res.json();
                if (result.success) {
                  setCartItems([]);
                  setShowPayment(false);
                  setCartOpen(false);
                  alert("Order placed! Pay with Cash on Delivery.");
                } else alert(result.error);
              }}
            >
              Cash on Delivery
            </button>
            <button
              className="cancel-btn"
              onClick={() => setShowPayment(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shop;
