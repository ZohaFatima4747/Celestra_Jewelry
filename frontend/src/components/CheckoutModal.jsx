import { useState } from "react";
import { getUserId } from "../utils/auth";
import { ORDER_URL } from "../utils/api";

const CheckoutModal = ({ cartItems, totalAmount, onSuccess, onClose }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const placeOrder = async () => {
    const userId = getUserId() || `guest_${Date.now()}`;
    const res = await fetch(`${ORDER_URL}/complete-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        customer: form,
        items: cartItems.map((i) => ({
          productId: i.product._id,
          name: i.product.name,
          price: i.product.price,
          qty: i.qty,
          selectedSize: i.selectedSize || null,
          selectedColor: i.selectedColor || null,
        })),
        total: totalAmount,
      }),
    });
    return res.json();
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
      onSuccess("Order placed! Pay with Cash on Delivery.");
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="payment-overlay">
      <div className="payment-popup">
        <button className="close-btn" onClick={onClose}>✕</button>
        <h2>Checkout</h2>

        <div className="user-details-form">
          {[
            { label: "Full Name",    name: "name",    type: "text",  placeholder: "Full Name" },
            { label: "Email",        name: "email",   type: "email", placeholder: "Email" },
            { label: "Phone Number", name: "phone",   type: "text",  placeholder: "Phone Number" },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <h3>{label}:</h3>
              <input type={type} name={name} placeholder={placeholder} value={form[name]} onChange={handleChange} />
            </div>
          ))}
          <h3>Address:</h3>
          <textarea name="address" placeholder="Address" value={form.address} onChange={handleChange} />
        </div>

        <button className="cod-btn" onClick={handleCOD}>Place Order (Cash on Delivery)</button>
        <button className="cancel-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default CheckoutModal;
