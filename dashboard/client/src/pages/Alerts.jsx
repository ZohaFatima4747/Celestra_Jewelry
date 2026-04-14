import { useEffect, useState } from 'react';
import api from '../utils/api';
import './Alerts.css';

function CollapsibleSection({ title, count, emptyMsg, children }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="alert-section">
      <button className="section-toggle" onClick={() => setOpen((o) => !o)}>
        <span>{title} ({count})</span>
        <span className={`toggle-icon ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && (
        count === 0
          ? <p className="empty-msg">{emptyMsg}</p>
          : children
      )}
    </section>
  );
}

export default function Alerts() {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/admin/alerts')
      .then((r) => setAlerts(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading alerts...</div>;
  if (error)   return <div className="page-loading">Failed to load alerts.</div>;

  return (
    <div className="alerts-page">
      <h2 className="page-title">Notifications & Alerts</h2>

      <CollapsibleSection
        title="⚠️ Low Stock Products"
        count={alerts.lowStock.length}
        emptyMsg="All products are well-stocked."
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Status</th></tr></thead>
            <tbody>
              {alerts.lowStock.map((p) => (
                <tr key={p._id}>
                  <td className="product-name">{p.name}</td>
                  <td>{p.category || '—'}</td>
                  <td><span className="stock-low">{p.stock}</span></td>
                  <td><span className="badge danger">{p.stock === 0 ? 'Out of Stock' : 'Low Stock'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="alert-cards">
          {alerts.lowStock.map((p) => (
            <div key={p._id} className="alert-card">
              <div className="alert-card__top">
                <span className="product-name">{p.name}</span>
                <span className="badge danger">{p.stock === 0 ? 'Out of Stock' : 'Low Stock'}</span>
              </div>
              {p.category && <div className="alert-card__row"><span>Category</span><span>{p.category}</span></div>}
              <div className="alert-card__row"><span>Stock</span><span className="stock-low">{p.stock}</span></div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="⏳ Pending Orders"
        count={alerts.pendingOrders.length}
        emptyMsg="No pending orders."
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {alerts.pendingOrders.map((o) => (
                <tr key={o._id}>
                  <td className="mono">#{o._id.slice(-8).toUpperCase()}</td>
                  <td>{o.customer?.name || '—'}</td>
                  <td>PKR {o.total?.toLocaleString()}</td>
                  <td><span className="badge warning">{o.status}</span></td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="alert-cards">
          {alerts.pendingOrders.map((o) => (
            <div key={o._id} className="alert-card">
              <div className="alert-card__top">
                <span className="mono">#{o._id.slice(-8).toUpperCase()}</span>
                <span className="badge warning">{o.status}</span>
              </div>
              <div className="alert-card__row"><span>Customer</span><span>{o.customer?.name || '—'}</span></div>
              <div className="alert-card__row"><span>Total</span><strong>PKR {o.total?.toLocaleString()}</strong></div>
              <div className="alert-card__row"><span>Date</span><span>{new Date(o.createdAt).toLocaleDateString()}</span></div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
