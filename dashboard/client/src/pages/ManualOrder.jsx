import { useState, useEffect } from 'react';
import api from '../utils/api';
import './ManualOrder.css';

const STATUSES = ['completed', 'delivered', 'pending COD', 'shipped', 'cancelled'];
const emptyItem = () => ({ productId: '', name: '', qty: 1, price: '' });

const STATUS_STYLE = {
  completed:     { bg: '#d1fae5', color: '#065f46' },
  delivered:     { bg: '#d1fae5', color: '#065f46' },
  'pending COD': { bg: '#fef3c7', color: '#92400e' },
  shipped:       { bg: '#dbeafe', color: '#1e40af' },
  cancelled:     { bg: '#fee2e2', color: '#991b1b' },
};

export default function ManualOrder() {
  const [products, setProducts]     = useState([]);
  const [items, setItems]           = useState([emptyItem()]);
  const [customer, setCustomer]     = useState({ name: '', phone: '', email: '', city: '', province: '', address: '' });
  const [status, setStatus]         = useState('completed');
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(null);

  useEffect(() => {
    api.get('/admin/products?limit=200')
      .then((r) => setProducts(Array.isArray(r.data) ? r.data : (r.data.products ?? [])))
      .catch(() => {});
  }, []);

  // ── Totals (cost fetched server-side, not shown to user) ────────────────────
  const totalAmount = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    setErrors((e) => { const n = { ...e }; delete n[`item_${idx}_${field}`]; return n; });
  };

  const selectProduct = (idx, productId) => {
    const p = products.find((p) => p._id === productId);
    setItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, productId, name: p ? p.name : item.name, price: p ? p.price : item.price } : item
    ));
    if (p) setErrors((e) => { const n = { ...e }; delete n[`item_${idx}_name`]; delete n[`item_${idx}_price`]; return n; });
  };

  const addItem    = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const setCust = (field) => (e) => {
    setCustomer((c) => ({ ...c, [field]: e.target.value }));
    if (field === 'name') setErrors((er) => { const n = { ...er }; delete n.customerName; return n; });
  };

  const validate = () => {
    const e = {};
    if (!customer.name.trim()) e.customerName = 'Customer name is required';
    items.forEach((item, idx) => {
      if (!item.name.trim())                              e[`item_${idx}_name`]  = 'Required';
      if (!item.qty || Number(item.qty) < 1)              e[`item_${idx}_qty`]   = 'Min 1';
      if (item.price === '' || isNaN(Number(item.price))) e[`item_${idx}_price`] = 'Required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSuccess(null);
    try {
      const { data } = await api.post('/admin/orders/manual', { customer, items, status });
      setSuccess(`Order #${data.order._id.slice(-8).toUpperCase()} saved · PKR ${data.order.total.toLocaleString()} · Profit PKR ${data.order.profit.toLocaleString()}`);
      setItems([emptyItem()]);
      setCustomer({ name: '', phone: '', email: '', city: '', province: '', address: '' });
      setStatus('completed');
      setErrors({});
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to create order' });
    } finally {
      setSubmitting(false);
    }
  };

  const ss = STATUS_STYLE[status] || STATUS_STYLE.completed;

  return (
    <div className="mo-page">

      {/* ── Page title ── */}
      <div className="mo-page-head">
        <div className="mo-page-head__left">
          <span className="mo-tag">🧾 POS / Offline Sale</span>
          <h1 className="mo-h1">Manual Order Entry</h1>
          <p className="mo-lead">Create a walk-in or phone order manually.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mo-body">

          {/* ══ MAIN COLUMN ══════════════════════════════════════════════════ */}
          <div className="mo-main">

            {/* ── Customer card ── */}
            <div className="mo-card">
              <div className="mo-card__header">
                <span className="mo-card__icon">👤</span>
                <h2 className="mo-card__title">Customer Info</h2>
              </div>

              <div className="mo-cust-grid">
                <div className="mo-field mo-field--2">
                  <label className="mo-label">Full Name <span className="mo-req">*</span></label>
                  <input value={customer.name} onChange={setCust('name')} placeholder="Customer name"
                    className={`mo-input${errors.customerName ? ' mo-input--err' : ''}`} />
                  {errors.customerName && <p className="mo-err">{errors.customerName}</p>}
                </div>
                <div className="mo-field">
                  <label className="mo-label">Phone</label>
                  <input value={customer.phone} onChange={setCust('phone')} placeholder="03xxxxxxxxx" className="mo-input" />
                </div>
                <div className="mo-field">
                  <label className="mo-label">Email</label>
                  <input value={customer.email} onChange={setCust('email')} placeholder="email@example.com" className="mo-input" />
                </div>
                <div className="mo-field">
                  <label className="mo-label">City</label>
                  <input value={customer.city} onChange={setCust('city')} placeholder="City" className="mo-input" />
                </div>
                <div className="mo-field">
                  <label className="mo-label">Province</label>
                  <input value={customer.province} onChange={setCust('province')} placeholder="Province" className="mo-input" />
                </div>
                <div className="mo-field mo-field--full">
                  <label className="mo-label">Address</label>
                  <input value={customer.address} onChange={setCust('address')} placeholder="Street address" className="mo-input" />
                </div>
              </div>
            </div>

            {/* ── Items card ── */}
            <div className="mo-card">
              <div className="mo-card__header">
                <span className="mo-card__icon">🛒</span>
                <h2 className="mo-card__title">Order Items</h2>
                <button type="button" className="mo-add-btn" onClick={addItem}>
                  <span>+</span> Add Item
                </button>
              </div>

              {/* Desktop table */}
              <div className="mo-table-wrap">
                <table className="mo-table">
                  <thead>
                    <tr>
                      <th style={{ width: '24px' }}>#</th>
                      <th>Product</th>
                      <th>Name <span className="mo-req">*</span></th>
                      <th style={{ width: '72px' }}>Qty</th>
                      <th style={{ width: '120px' }}>Price (PKR)</th>
                      <th style={{ width: '120px' }}>Subtotal</th>
                      <th style={{ width: '36px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className={Object.keys(errors).some(k => k.startsWith(`item_${idx}`)) ? 'mo-tr--err' : ''}>
                        <td className="mo-td-num">{idx + 1}</td>
                        <td>
                          <select className="mo-select" value={item.productId} onChange={(e) => selectProduct(idx, e.target.value)}>
                            <option value="">— select —</option>
                            {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td>
                          <input className={`mo-input${errors[`item_${idx}_name`] ? ' mo-input--err' : ''}`}
                            value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} placeholder="Product name" />
                          {errors[`item_${idx}_name`] && <p className="mo-err">{errors[`item_${idx}_name`]}</p>}
                        </td>
                        <td>
                          <input type="number" min="1"
                            className={`mo-input mo-input--c${errors[`item_${idx}_qty`] ? ' mo-input--err' : ''}`}
                            value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} />
                          {errors[`item_${idx}_qty`] && <p className="mo-err">{errors[`item_${idx}_qty`]}</p>}
                        </td>
                        <td>
                          <input type="number" min="0"
                            className={`mo-input${errors[`item_${idx}_price`] ? ' mo-input--err' : ''}`}
                            value={item.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} placeholder="0" />
                          {errors[`item_${idx}_price`] && <p className="mo-err">{errors[`item_${idx}_price`]}</p>}
                        </td>
                        <td>
                          <div className="mo-subtotal-pill">
                            PKR {((Number(item.price) || 0) * (Number(item.qty) || 0)).toLocaleString()}
                          </div>
                        </td>
                        <td>
                          {items.length > 1 && (
                            <button type="button" className="mo-del-btn" onClick={() => removeItem(idx)} title="Remove">✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked cards */}
              <div className="mo-mob-items">
                {items.map((item, idx) => (
                  <div key={idx} className="mo-mob-item">
                    <div className="mo-mob-item__head">
                      <span className="mo-mob-item__label">Item {idx + 1}</span>
                      {items.length > 1 && (
                        <button type="button" className="mo-del-btn" onClick={() => removeItem(idx)}>✕</button>
                      )}
                    </div>
                    <div className="mo-field">
                      <label className="mo-label">Product (optional)</label>
                      <select className="mo-select" value={item.productId} onChange={(e) => selectProduct(idx, e.target.value)}>
                        <option value="">— select product —</option>
                        {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="mo-field">
                      <label className="mo-label">Name <span className="mo-req">*</span></label>
                      <input className={`mo-input${errors[`item_${idx}_name`] ? ' mo-input--err' : ''}`}
                        value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} placeholder="Product name" />
                      {errors[`item_${idx}_name`] && <p className="mo-err">{errors[`item_${idx}_name`]}</p>}
                    </div>
                    <div className="mo-mob-row">
                      <div className="mo-field">
                        <label className="mo-label">Qty <span className="mo-req">*</span></label>
                        <input type="number" min="1"
                          className={`mo-input mo-input--c${errors[`item_${idx}_qty`] ? ' mo-input--err' : ''}`}
                          value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} />
                        {errors[`item_${idx}_qty`] && <p className="mo-err">{errors[`item_${idx}_qty`]}</p>}
                      </div>
                      <div className="mo-field">
                        <label className="mo-label">Price (PKR) <span className="mo-req">*</span></label>
                        <input type="number" min="0"
                          className={`mo-input${errors[`item_${idx}_price`] ? ' mo-input--err' : ''}`}
                          value={item.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} placeholder="0" />
                        {errors[`item_${idx}_price`] && <p className="mo-err">{errors[`item_${idx}_price`]}</p>}
                      </div>
                    </div>
                    <div className="mo-mob-subtotal">
                      <span>Subtotal</span>
                      <strong>PKR {((Number(item.price) || 0) * (Number(item.qty) || 0)).toLocaleString()}</strong>
                    </div>
                  </div>
                ))}
                <button type="button" className="mo-add-btn mo-add-btn--full" onClick={addItem}>
                  + Add Item
                </button>
              </div>
            </div>

          </div>{/* end mo-main */}

          {/* ══ SIDEBAR ══════════════════════════════════════════════════════ */}
          <div className="mo-sidebar">

            {/* Order summary */}
            <div className="mo-card mo-summary-card">
              <div className="mo-card__header">
                <span className="mo-card__icon">📋</span>
                <h2 className="mo-card__title">Order Summary</h2>
              </div>

              {/* Live line items */}
              <div className="mo-summary-lines">
                {items.some(i => i.name || Number(i.price) > 0) ? (
                  items.map((item, idx) => (
                    (item.name || Number(item.price) > 0) ? (
                      <div key={idx} className="mo-summary-line">
                        <span className="mo-summary-line__name">
                          {item.name || '—'} <span className="mo-summary-line__qty">× {item.qty}</span>
                        </span>
                        <span className="mo-summary-line__val">
                          PKR {((Number(item.price) || 0) * (Number(item.qty) || 0)).toLocaleString()}
                        </span>
                      </div>
                    ) : null
                  ))
                ) : (
                  <p className="mo-summary-empty">No items added yet</p>
                )}
              </div>

              <div className="mo-summary-sep" />

              <div className="mo-summary-total-row">
                <span>Order Total</span>
                <strong>PKR {totalAmount.toLocaleString()}</strong>
              </div>

              <div className="mo-summary-sep" />

              {/* Status */}
              <div className="mo-field">
                <label className="mo-label">Order Status</label>
                <select className="mo-select" value={status} onChange={(e) => setStatus(e.target.value)}
                  style={{ background: ss.bg, color: ss.color, fontWeight: 700, borderColor: ss.color + '55' }}>
                  {STATUSES.map((s) => <option key={s} value={s} style={{ background: '#fff', color: '#111' }}>{s}</option>)}
                </select>
              </div>

              {/* Alerts */}
              {errors.submit && <div className="mo-alert mo-alert--error">{errors.submit}</div>}
              {success       && <div className="mo-alert mo-alert--success">✓ {success}</div>}

              {/* Submit */}
              <button type="submit" className="mo-submit-btn" disabled={submitting}>
                {submitting ? 'Saving…' : '💾 Save Order'}
              </button>

              <p className="mo-hint">Cost price is auto-fetched from the product catalogue.</p>
            </div>

          </div>

        </div>{/* end mo-body */}
      </form>
    </div>
  );
}
