import { useEffect, useState } from 'react';
import api from '../utils/api';
import './Customers.css';

export default function Customers() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/users'), api.get('/admin/orders')])
      .then(([u, o]) => { setUsers(u.data); setOrders(o.data); })
      .finally(() => setLoading(false));
  }, []);

  const del = async (id) => {
    if (!confirm('Delete this customer?')) return;
    await api.delete(`/admin/users/${id}`);
    setUsers((prev) => prev.filter((u) => u._id !== id));
  };

  // Count orders per customer email
  const orderCount = (email) => orders.filter((o) => o.customer?.email === email).length;
  const isReturning = (email) => orderCount(email) > 1;

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.city?.toLowerCase().includes(search.toLowerCase()) ||
    u.province?.toLowerCase().includes(search.toLowerCase())
  );

  const newCount = users.filter((u) => !u.isGuest && !isReturning(u.email)).length;
  const returningCount = users.filter((u) => !u.isGuest && isReturning(u.email)).length;
  const guestCount = users.filter((u) => u.isGuest).length;

  if (loading) return <div className="page-loading">Loading customers...</div>;

  return (
    <div className="customers-page">
      <h2 className="page-title">Customers</h2>

      <div className="customer-stats">
        <div className="cstat-card"><span className="cstat-val">{users.length}</span><span className="cstat-label">Total</span></div>
        <div className="cstat-card new"><span className="cstat-val">{newCount}</span><span className="cstat-label">New</span></div>
        <div className="cstat-card returning"><span className="cstat-val">{returningCount}</span><span className="cstat-label">Returning</span></div>
        <div className="cstat-card guest"><span className="cstat-val">{guestCount}</span><span className="cstat-label">Guests</span></div>
      </div>

      <input className="search-input" placeholder="Search by name, email, or city..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Province</th><th>City</th><th>Address</th><th>Status</th><th>Orders</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} className="empty-row">No customers found</td></tr>}
            {filtered.map((u) => (
              <tr key={u._id}>
                <td className="customer-name">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone || '—'}</td>
                <td>{u.province || '—'}</td>
                <td>{u.city || '—'}</td>
                <td className="address-cell">{u.address || '—'}</td>
                <td>
                  <div className="badge-group">
                    <span className={`type-badge ${isReturning(u.email) ? 'returning' : 'new'}`}>
                      {isReturning(u.email) ? 'Returning' : 'New'}
                    </span>
                    {u.isGuest && <span className="type-badge guest">Guest</span>}
                  </div>
                </td>
                <td>{orderCount(u.email)}</td>
                <td>
                  <button className="del-btn" onClick={() => del(u._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
