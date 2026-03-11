import React from "react";
import "./CartModal.css";

const CartModal = ({ cartItems = [], onClose, onCheckout, removeItem }) => {
  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0
  );

  return (
    <div className="cart-overlay">
      <div className="cart-sidebar">
        <h2 className="cart-title">Your Cart</h2>

        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="cart-items">
          {cartItems.length === 0 && <p>Cart is empty</p>}
          {cartItems.map((item) => (
            <div className="cart-item" key={item._id}>
              <div className="cart-item-info">
                <span className="item-name">{item.product.name}</span>
                <span className="item-price">
                  {item.qty} × Rs {item.product.price}
                </span>
              </div>
              <button
                className="remove-btn"
                onClick={() => removeItem(item._id)}
              >
                🗑
              </button>
            </div>
          ))}
        </div>

        <div className="cart-footer">
          <h3>Total: Rs {total}</h3>
          <button
  className={`checkout-btn ${cartItems.length === 0 ? "disabled" : ""}`}
  disabled={cartItems.length === 0}
  onClick={() => {
    if (cartItems.length === 0) return;
    onCheckout();
  }}
>
  Checkout
</button>

        </div>
      </div>
    </div>
  );
};

export default CartModal;
