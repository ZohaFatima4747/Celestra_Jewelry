import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Orders.css';

const STATUSES = ['pending COD', 'shipped', 'delivered', 'cancelled', 'completed'];

const statusColor = {
  'pending COD': '#e67e22',
  shipped:       '#3498db',
  delivered:     '#2ecc71',
  cancelled:     '#e74c3c',
  completed:     '#9b59b6',
};

function OrderDetailModal({ order, onClose, onStatusChange }) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  const handleStatus = async (val) => {
    setStatus(val);
    setSaving(true);
    await onStatusChange(order._id, val);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="order-modal__header">
          <div>
            <h3>Order Detail</h3>
            <span className="mono">#{order._id.slice(-8).toUpperCase()}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="order-modal__body">
          {/* Customer Info */}
          <section className="od-section">
            <h4>Customer</h4>
            <div className="od-grid">
              <div><label>Name</label><span>{order.customer?.name || '—'}</span></div>
              <div><label>Email</label><span>{order.customer?.email || '—'}</span></div>
              <div><label>Phone</label><span>{order.customer?.phone || '—'}</span></div>
              <div><label>Province</label><span>{order.customer?.province || '—'}</span></div>
              <div><label>City</label><span>{order.customer?.city || '—'}</span></div>
              <div className="od-grid-full"><label>Address</label><span>{order.customer?.address || '—'}</span></div>
            </div>
          </section>

          {/* Order Meta */}
          <section className="od-section">
            <h4>Order Info</h4>
            <div className="od-grid">
              <div><label>Date</label><span>{new Date(order.createdAt).toLocaleString()}</span></div>
              <div>
                <label>Status</label>
                <select
                  className="status-select"
                  value={status}
                  disabled={saving}
                  onChange={(e) => handleStatus(e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {order.orderType === 'manual' && (
                <>
                  <div><label>Type</label><span style={{ color: '#4361ee', fontWeight: 700 }}>Manual / Offline</span></div>
                  <div><label>Profit</label><span style={{ color: '#2ecc71', fontWeight: 700 }}>PKR {order.profit?.toLocaleString() ?? '—'}</span></div>
                </>
              )}
            </div>
          </section>

          {/* Items */}
          <section className="od-section">
            <h4>Items</h4>
            <div className="od-items-wrap">
              <table className="od-items-table">
                <thead>
                  <tr><th>Product</th><th>Size</th><th>Color</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {order.items?.map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td>{item.selectedSize || '—'}</td>
                      <td>{item.selectedColor || '—'}</td>
                      <td>{item.qty}</td>
                      <td>PKR {item.price?.toLocaleString()}</td>
                      <td>PKR {(item.price * item.qty)?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="od-total">
            Total: <strong>PKR {order.total?.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/admin/orders?limit=100').then((r) => {
      const list = Array.isArray(r.data) ? r.data : (r.data.orders ?? []);
      const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted);
      setFiltered(sorted);
    }).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = orders;
    if (statusFilter !== 'all') data = data.filter((o) => o.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((o) =>
        o.customer?.name?.toLowerCase().includes(q) ||
        o.customer?.email?.toLowerCase().includes(q) ||
        o._id.includes(q)
      );
    }
    setFiltered(data);
  }, [search, statusFilter, orders]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/admin/orders/${id}`, { status });
      setOrders((prev) => prev.map((o) => o._id === id ? { ...o, status } : o));
      if (selected?._id === id) setSelected((prev) => ({ ...prev, status }));
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const exportCSV = () => {
    const rows = [['Order ID', 'Customer', 'Email', 'Phone', 'Province', 'City', 'Address', 'Total', 'Status', 'Date']];
    filtered.forEach((o) => rows.push([
      o._id, o.customer?.name, o.customer?.email, o.customer?.phone || '',
      o.customer?.province || '', o.customer?.city || '', `"${o.customer?.address || ''}"`,
      o.total, o.status, new Date(o.createdAt).toLocaleDateString()
    ]));
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click();
  };

  if (loading) return <div className="page-loading">Loading orders...</div>;

  return (
    <div className="orders-page">
      <div className="page-header">
        <h2 className="page-title">Orders Management</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/dashboard/orders/manual" className="export-btn" style={{ textDecoration: 'none' }}>🧾 New Manual Order</Link>
          <button className="export-btn" onClick={exportCSV}>⬇ Export CSV</button>
        </div>
      </div>

      <div className="filters">
        <input
          className="search-input" placeholder="Search by name, email, or order ID..."
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th><th>Customer</th><th>Items</th>
              <th>Total</th><th>Status</th><th>Date</th><th>Update</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="empty-row">No orders found</td></tr>
            )}
            {filtered.map((o) => (
              <tr key={o._id}>
                <td className="mono">
                  #{o._id.slice(-8).toUpperCase()}
                  {o.orderType === 'manual' && <span className="manual-badge">manual</span>}
                </td>
                <td>
                  <div className="customer-name">{o.customer?.name}</div>
                  <div className="customer-email">{o.customer?.email}</div>
                  {o.customer?.phone && <div className="customer-meta">{o.customer.phone}</div>}
                  {(o.customer?.city || o.customer?.province) && (
                    <div className="customer-meta">
                      {[o.customer.city, o.customer.province].filter(Boolean).join(', ')}
                    </div>
                  )}
                </td>                <td>
                  <div>{o.items?.length} item(s)</div>
                  <div className="order-product-names">
                    {o.items?.map((item, i) => (
                      <span key={i}>{item.name}{item.qty > 1 ? ` ×${item.qty}` : ''}</span>
                    ))}
                  </div>
                </td>
                <td>PKR {o.total?.toLocaleString()}</td>
                <td>
                  <span className="status-badge" style={{ background: statusColor[o.status] + '22', color: statusColor[o.status] }}>
                    {o.status}
                  </span>
                </td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>
                  <select
                    className="status-select"
                    value={o.status}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <button className="view-btn" onClick={() => setSelected(o)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="orders-cards">
        {filtered.length === 0 && <p className="empty-row">No orders found</p>}
        {filtered.map((o) => (
          <div key={o._id} className="order-card">
            <div className="order-card__top">
              <span className="mono">#{o._id.slice(-8).toUpperCase()}</span>
              <span className="status-badge" style={{ background: statusColor[o.status] + '22', color: statusColor[o.status] }}>
                {o.status}
              </span>
            </div>
            <div className="order-card__row"><span>Customer</span><span>{o.customer?.name || '—'}</span></div>
            <div className="order-card__row"><span>Email</span><span>{o.customer?.email || '—'}</span></div>
            {o.customer?.phone && <div className="order-card__row"><span>Phone</span><span>{o.customer.phone}</span></div>}
            <div className="order-card__row"><span>Items</span><span>{o.items?.length} item(s)</span></div>
            <div className="order-card__row"><span>Total</span><strong>PKR {o.total?.toLocaleString()}</strong></div>
            <div className="order-card__row"><span>Date</span><span>{new Date(o.createdAt).toLocaleDateString()}</span></div>
            <div className="order-card__actions">
              <select
                className="status-select"
                value={o.status}
                onChange={(e) => updateStatus(o._id, e.target.value)}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="view-btn" onClick={() => setSelected(o)}>View</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
        />
      )}
    </div>
  );
}
