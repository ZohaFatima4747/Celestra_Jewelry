import { useEffect, useState } from "react";
import { getUserId } from "../utils/auth";
import { CART_URL, ORDER_URL } from "../utils/api";
import { resolveImage } from "../utils/assetMap";
import api from "../utils/axiosInstance";
import "./UserCart.css";

const UserCart = () => {
  const [cart, setCart]               = useState({ items: [], total: 0 });
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [form, setForm]               = useState({ name: "", email: "", phone: "", address: "" });

  const handleFormChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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

  const placeOrder = async () => {
    const userId = getUserId();
    if (!userId) return alert("Login first");
    const res = await api.post(`${ORDER_URL}/complete-payment`, {
      userId,
      customer: form,
      items: cart.items.map((i) => ({
        productId: i.product._id,
        name: i.product.name,
        price: i.product.price,
        qty: i.qty,
        selectedSize: i.selectedSize || null,
        selectedColor: i.selectedColor || null,
      })),
      total: cart.total,
    });
    return res.data;
  };

  const handleCOD = async () => {
    if (!form.name || !form.email || !form.phone || !form.address) {
      alert("Please fill in all fields.");
      return;
    }
    const result = await placeOrder();
    if (result.success) {
      if (form.email) {
        localStorage.setItem("guestEmail", form.email);
        localStorage.setItem("guestName", form.name || "");
      }
      setShowPayment(false);
      fetchCart();
      alert("Order placed! Pay with Cash on Delivery.");
    } else {
      alert(result.error || "Something went wrong.");
    }
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
        <div className="payment-overlay">
          <div className="payment-popup">
            <button className="close-btn" onClick={() => setShowPayment(false)}>x</button>
            <h2>Checkout</h2>
            <div className="user-details-form">
              {[
                { label: "Full Name",    name: "name",  type: "text",  placeholder: "Full Name" },
                { label: "Email",        name: "email", type: "email", placeholder: "Email" },
                { label: "Phone Number", name: "phone", type: "text",  placeholder: "Phone Number" },
              ].map(({ label, name, type, placeholder }) => (
                <div key={name}>
                  <h3>{label}:</h3>
                  <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={handleFormChange}
                  />
                </div>
              ))}
              <h3>Address:</h3>
              <textarea
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleFormChange}
              />
            </div>
            <button className="cod-btn" onClick={handleCOD}>Place Order (Cash on Delivery)</button>
            <button className="cancel-btn" onClick={() => setShowPayment(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCart;