import "./CartModal.css";

/**
 * Slide-in cart sidebar.
 * Cart state is managed by CartContext — this component is purely presentational.
 */
const CartModal = ({ cartItems = [], onClose, onCheckout, removeItem, increaseQty, deleteItem }) => {
  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  return (
    <div className="cart-overlay">
      <div className="cart-sidebar">
        <h2 className="cart-title">Your Cart</h2>
        <button className="close-btn" onClick={onClose}>✕</button>

        <div className="cart-items">
          {cartItems.length === 0 && <p>Cart is empty</p>}
          {cartItems.map((item) => (
            <div className="cart-item" key={item._id}>
              <button className="item-delete-btn" onClick={() => deleteItem(item._id)} title="Remove item">✕</button>
              <div className="cart-item-info">
                <span className="item-name">{item.product.name}</span>
                {(item.selectedSize || item.selectedColor) && (
                  <span className="item-variant">
                    {item.selectedSize && `Size: ${item.selectedSize}`}
                    {item.selectedSize && item.selectedColor && " · "}
                    {item.selectedColor && `Color: ${item.selectedColor}`}
                  </span>
                )}
                <span className="item-price">Rs {item.product.price?.toLocaleString()}</span>
              </div>
              <div className="cart-item-qty">
                <button className="qty-btn" onClick={() => removeItem(item._id)}>−</button>
                <span className="qty-val">{item.qty}</span>
                <button className="qty-btn" onClick={() => increaseQty(item._id)}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-footer">
          <h3>Total: Rs {total.toLocaleString()}</h3>
          <button
            className={`checkout-btn ${cartItems.length === 0 ? "disabled" : ""}`}
            disabled={cartItems.length === 0}
            onClick={() => cartItems.length > 0 && onCheckout()}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
