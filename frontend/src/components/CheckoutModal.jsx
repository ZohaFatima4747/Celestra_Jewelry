import { useState, useRef, useEffect } from "react";
import { getUserId } from "../utils/auth";
import { ORDER_URL } from "../utils/api";
import "./CheckoutModal.css";
import {
  PAKISTAN_LOCATIONS,
  PROVINCES,
  validateCheckoutForm,
} from "../utils/checkoutValidation";

// ── Province combobox: fixed list, no free-type ───────────────────────────────
const ProvinceCombobox = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (province) => {
    onChange(province);
    setOpen(false);
  };

  return (
    <div className="city-combobox" ref={wrapRef}>
      <div
        className={`city-combobox__input-wrap${open ? " city-combobox__input-wrap--open" : ""}${error ? " city-combobox__input-wrap--error" : ""}`}
      >
        <button
          type="button"
          className={`city-combobox__trigger${!value ? " city-combobox__trigger--placeholder" : ""}`}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {value || "Select Province"}
        </button>
        <span className={`city-combobox__arrow${open ? " city-combobox__arrow--up" : ""}`}>▾</span>
      </div>

      {open && (
        <ul className="city-combobox__list" role="listbox">
          {PROVINCES.map((p) => (
            <li
              key={p}
              role="option"
              aria-selected={p === value}
              className={`city-combobox__option${p === value ? " city-combobox__option--selected" : ""}`}
              onMouseDown={() => handleSelect(p)}
            >
              {p}
              {p === value && <span className="city-combobox__check">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── City combobox: dropdown list + free-type for custom cities ────────────────
const CityCombobox = ({ province, value, onChange, error }) => {
  const cities = province ? PAKISTAN_LOCATIONS[province] ?? [] : [];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const wrapRef = useRef(null);

  // Sync external value resets (e.g. province change)
  useEffect(() => { setQuery(value || ""); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? cities.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()))
    : cities;

  const handleInput = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (city) => {
    setQuery(city);
    onChange(city);
    setOpen(false);
  };

  const disabled = !province;

  return (
    <div
      className={`city-combobox${disabled ? " city-combobox--disabled" : ""}`}
      ref={wrapRef}
    >
      <div
        className={`city-combobox__input-wrap${open ? " city-combobox__input-wrap--open" : ""}${error ? " city-combobox__input-wrap--error" : ""}`}
      >
        <input
          type="text"
          placeholder={disabled ? "Select province first" : "Type or select city"}
          value={query}
          disabled={disabled}
          onChange={handleInput}
          onFocus={() => !disabled && setOpen(true)}
          autoComplete="off"
          aria-label="City"
        />
        <span
          className={`city-combobox__arrow${open ? " city-combobox__arrow--up" : ""}`}
          onClick={() => !disabled && setOpen((o) => !o)}
        >▾</span>
      </div>

      {open && filtered.length > 0 && (
        <ul className="city-combobox__list" role="listbox">
          {filtered.map((city) => (
            <li
              key={city}
              role="option"
              aria-selected={city === value}
              className={`city-combobox__option${city === value ? " city-combobox__option--selected" : ""}`}
              onMouseDown={() => handleSelect(city)}
            >
              {city}
              {city === value && <span className="city-combobox__check">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────
const CheckoutModal = ({ cartItems, totalAmount, onSuccess, onClose }) => {
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    province: "", city: "", address: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field, val) => {
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      // Reset city when province changes
      if (field === "province") next.city = "";
      return next;
    });
    // Clear field error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleChange = (e) => set(e.target.name, e.target.value);

  const placeOrder = async () => {
    const userId = getUserId() || `guest_${Date.now()}`;
    const res = await fetch(`${ORDER_URL}/complete-payment`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        customer: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          province: form.province,
          city: form.city.trim(),
          address: form.address.trim(),
        },
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
    const { errors: errs, isValid } = validateCheckoutForm(form);
    if (!isValid) { setErrors(errs); return; }

    setLoading(true);
    setServerError("");
    try {
      const result = await placeOrder();
      if (result.success) {
        if (form.email) {
          localStorage.setItem("guestEmail", form.email.trim().toLowerCase());
          localStorage.setItem("guestName", form.name.trim() || "");
        }
        onSuccess("Order placed! Pay with Cash on Delivery.");
      } else {
        setServerError(result.error || "Something went wrong. Please try again.");
      }
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const showPreview =
    form.province && form.city.trim() && form.address.trim();

  return (
    <div className="checkout-overlay" role="dialog" aria-modal="true" aria-label="Checkout">
      <div className="checkout-popup">
        <button className="checkout-close-btn" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="checkout-title">Checkout</h2>

        <div className="checkout-form">
          {/* Full Name */}
          <div className={`checkout-field${errors.name ? " has-error" : ""}`}>
            <label htmlFor="co-name">Full Name</label>
            <input id="co-name" name="name" type="text" placeholder="Full Name"
              value={form.name} onChange={handleChange} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          {/* Email */}
          <div className={`checkout-field${errors.email ? " has-error" : ""}`}>
            <label htmlFor="co-email">Email</label>
            <input id="co-email" name="email" type="email" placeholder="example@domain.com"
              value={form.email} onChange={handleChange} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          {/* Phone */}
          <div className={`checkout-field${errors.phone ? " has-error" : ""}`}>
            <label htmlFor="co-phone">Phone Number</label>
            <input id="co-phone" name="phone" type="text"
              placeholder="03001234567 or +923001234567"
              value={form.phone} onChange={handleChange} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          {/* Province */}
          <div className={`checkout-field${errors.province ? " has-error" : ""}`}>
            <label>Province</label>
            <ProvinceCombobox
              value={form.province}
              onChange={(val) => set("province", val)}
              error={!!errors.province}
            />
            {errors.province && <span className="field-error">{errors.province}</span>}
          </div>

          {/* City */}
          <div className={`checkout-field${errors.city ? " has-error" : ""}`}>
            <label>City</label>
            <CityCombobox
              province={form.province}
              value={form.city}
              onChange={(val) => set("city", val)}
              error={!!errors.city}
            />
            {errors.city && <span className="field-error">{errors.city}</span>}
          </div>

          {/* Address */}
          <div className={`checkout-field${errors.address ? " has-error" : ""}`}>
            <label htmlFor="co-address">Address</label>
            <textarea id="co-address" name="address"
              placeholder="Street, apartment, area..."
              value={form.address} onChange={handleChange} />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>

          {/* Address preview */}
          {showPreview && (
            <div className="address-preview">
              {form.city}, {form.province} — {form.address.trim()}
            </div>
          )}
        </div>

        {serverError && <div className="checkout-server-error">{serverError}</div>}

        <button className={`cod-btn${loading ? " loading" : ""}`}
          onClick={handleCOD} disabled={loading}>
          {loading ? "Placing Order…" : "Place Order (Cash on Delivery)"}
        </button>
        <button className="checkout-cancel-btn" onClick={onClose} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CheckoutModal;
