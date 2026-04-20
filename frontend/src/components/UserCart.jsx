import { useEffect, useState } from "react";
import { getUserId } from "../utils/auth";
import { CART_URL } from "../utils/api";
import { resolveImage } from "../utils/assetMap";
import api from "../utils/axiosInstance";
import CheckoutModal from "./CheckoutModal";
import "./UserCart.css";

const UserCart = () => {
  const [cart, setCart]               = useState({ items: [], total: 0 });
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading]         = useState(false);

  const fetchCart = async () => {
    const userId = getUserId();
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.get(`${CART_URL}?userId=${userId}`);
      setCart(res.data);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, []);

  const removeItem = async (cartItemId) => {
    const userId = getUserId();
    if (!userId) return;
    await api.post(`${CART_URL}/remove`, { userId, cartItemId });
    fetchCart();
  };

  const deleteItem = async (cartItemId) => {
    const userId = getUserId();
    if (!userId) return;
    setCart((prev) => {
      const items = prev.items.filter((i) => i._id !== cartItemId);
      const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
      return { ...prev, items, total };
    });
    await api.post(`${CART_URL}/delete`, { userId, cartItemId });
    fetchCart();
  };

  const increaseQty = async (cartItemId) => {
    const userId = getUserId();
    if (!userId) return;
    const productId = cart.items.find((i) => i._id === cartItemId)?.product._id;
    if (!productId) return;
    await api.post(`${CART_URL}/add`, { userId, productId });
    fetchCart();
  };

  const handleOrderSuccess = (message) => {
    setShowPayment(false);
    setCart({ items: [], total: 0 });
    alert(message);
  };

  return (
    <div className="uc-wrap">
      {loading ? (
        <div className="uc-loading"><div className="uc-spinner" /><p>Loading cart...</p></div>
      ) : cart.items?.length === 0 ? (
        <div className="uc-empty"><span>Cart is empty</span></div>
      ) : (
        <>
          <div className="uc-list">
            {cart.items?.map((item) => (
              <div className="uc-item" key={item._id}>
                <button className="uc-delete-btn" onClick={() => deleteItem(item._id)} title="Remove item">x</button>
                <div className="uc-item-img">
                  <img src={resolveImage(item.product.images?.[0])} alt={item.product.name} />
                </div>
                <div className="uc-item-info">
                  <span className="uc-item-cat">{item.product.category}</span>
                  <h4 className="uc-item-name">{item.product.name}</h4>
                  {(item.selectedSize || item.selectedColor) && (
                    <span className="uc-item-variant">
                      {item.selectedSize && `Size: ${item.selectedSize}`}
                      {item.selectedSize && item.selectedColor && " - "}
                      {item.selectedColor && `Color: ${item.selectedColor}`}
                    </span>
                  )}
                  <span className="uc-item-price">Rs {item.product.price?.toLocaleString()}</span>
                </div>
                <div className="uc-item-controls">
                  <button className="uc-qty-btn minus" onClick={() => removeItem(item._id)}>-</button>
                  <span className="uc-qty">{item.qty}</span>
                  <button className="uc-qty-btn plus" onClick={() => increaseQty(item._id)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="uc-footer">
            <div className="uc-total-row">
              <span className="uc-total-label">Total Amount</span>
              <span className="uc-grand-total">Rs {cart.total?.toLocaleString()}</span>
            </div>
            <button className="uc-checkout-btn" onClick={() => setShowPayment(true)}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}

      {showPayment && (
        <CheckoutModal
          cartItems={cart.items}
          totalAmount={cart.total}
          onSuccess={handleOrderSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default UserCart;