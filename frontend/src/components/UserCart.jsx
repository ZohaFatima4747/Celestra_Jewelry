import React, { useEffect, useState } from "react";
import StripePayment from "./StripePayment";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import "./UserCart.css";

const stripePromise = loadStripe(
  "pk_test_51Rpnd4GaJ8id7jyS1lh9GxEBfZivIVY3dHpUvvbbXh7KpRmadYpqSkXm3MaHEVCoYekFwgpAaJu6jik4S45HWzSi00lPtxtpFm",
);

const UserCart = () => {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

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

  const fetchCart = async () => {
    const userId = getUserId();
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:1000/api/cart?userId=${userId}`,
      );
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const removeItem = async (cartItemId) => {
    const userId = getUserId();
    if (!userId) return;
    await fetch("http://localhost:1000/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cartItemId }),
    });
    fetchCart();
  };

  const increaseQty = async (cartItemId) => {
    const userId = getUserId();
    if (!userId) return;
    const productId = cart.items.find((i) => i._id === cartItemId)?.product._id;
    if (!productId) return;
    await fetch("http://localhost:1000/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId }),
    });
    fetchCart();
  };

  return (
    <div className="uc-wrap">
      {loading ? (
        <div className="uc-loading">
          <div className="uc-spinner" />
          <p>Loading cart...</p>
        </div>
      ) : cart.items?.length === 0 ? (
        <div className="uc-empty">
          <span>🛒</span>
          <p>Your cart is empty</p>
        </div>
      ) : (
        <>
          <div className="uc-list">
            {cart.items?.map((item) => (
              <div className="uc-item" key={item._id}>
                <div className="uc-item-img">
                  <img src={item.product.image} alt={item.product.name} />
                </div>

                <div className="uc-item-info">
                  <span className="uc-item-cat">{item.product.category}</span>
                  <h4 className="uc-item-name">{item.product.name}</h4>
                  <span className="uc-item-price">
                    Rs {item.product.price?.toLocaleString()} / each
                  </span>
                </div>

                <div className="uc-item-controls">
                  <button
                    className="uc-qty-btn minus"
                    onClick={() => removeItem(item._id)}
                  >
                    −
                  </button>
                  <span className="uc-qty">{item.qty}</span>
                  <button
                    className="uc-qty-btn plus"
                    onClick={() => increaseQty(item._id)}
                  >
                    +
                  </button>
                </div>

                <div className="uc-item-total">
                  Rs {(item.product.price * item.qty)?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="uc-footer">
            <div className="uc-total-row">
              <span className="uc-total-label">Total Amount</span>
              <span className="uc-grand-total">
                Rs {cart.total?.toLocaleString()}
              </span>
            </div>
            <button
              className="uc-checkout-btn"
              onClick={() => setShowPayment(true)}
            >
              Proceed to Checkout →
            </button>
          </div>
        </>
      )}

      {/* CHECKOUT MODAL — original white style, unchanged */}
      {showPayment && (
        <div className="payment-overlay">
          <div className="payment-popup">
            <button className="close-btn" onClick={() => setShowPayment(false)}>
              ✕
            </button>
            <h2>Checkout</h2>
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
                amount={cart.total}
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
                        items: cart.items.map((i) => ({
                          productId: i.product._id,
                          name: i.product.name,
                          price: i.product.price,
                          qty: i.qty,
                        })),
                        total: cart.total,
                      }),
                    },
                  );
                  const result = await res.json();
                  if (result.success) {
                    setShowPayment(false);
                    fetchCart();
                    alert("Payment successful! Order completed.");
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
                      items: cart.items.map((i) => ({
                        productId: i.product._id,
                        name: i.product.name,
                        price: i.product.price,
                        qty: i.qty,
                      })),
                      total: cart.total,
                    }),
                  },
                );
                const result = await res.json();
                if (result.success) {
                  setShowPayment(false);
                  fetchCart();
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
};

export default UserCart;
