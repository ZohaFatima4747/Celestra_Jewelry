import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import './DashboardHome.css';

const StatBadge = ({ label, dotColor }) => (
  <span className="stat-badge">
    <span className="stat-dot" style={{ background: dotColor }} />
    {label}
  </span>
);

const StatCard = ({ badge, badgeDot, value, label, accent, icon, alert }) => (
  <div className={`stat-card${alert ? ' stat-card--alert' : ''}`}>
    <div className="stat-card__top">
      <StatBadge label={badge} dotColor={badgeDot} />
    </div>
    <div className="stat-card__value">{value}</div>
    <div className="stat-card__footer">
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__icon" style={{ color: accent }}>{icon}</span>
    </div>
  </div>
);

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/products')])
      .then(([s, p]) => {
        setStats(s.data);
        setProducts(p.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard...</div>;

  const lowStock = products.filter((p) => p.stock <= 5);
  const profit = (stats.totalRevenue * 0.3).toFixed(2);

  return (
    <div className="dash-home">
      <h2 className="page-title">Dashboard Overview</h2>

      {/* Row 1 — 5 cards */}
      <div className="stat-grid stat-grid--5">
        <StatCard badge="All time"  badgeDot="#4361ee" value={stats.totalOrders}                          label="Total orders"   accent="#4361ee" icon="⊞" />
        <StatCard badge="Done"      badgeDot="#2ecc71" value={stats.completedOrders}                      label="Completed"      accent="#2ecc71" icon="✓" />
        <StatCard badge="Active"    badgeDot="#f39c12" value={stats.pendingOrders}                        label="Pending"        accent="#f39c12" icon="≡" />
        <StatCard badge="Void"      badgeDot="#e74c3c" value={stats.cancelledOrders}                      label="Cancelled"      accent="#e74c3c" icon="✕" />
        <StatCard badge="PKR"       badgeDot="#9b59b6" value={`PKR ${stats.totalRevenue?.toLocaleString()}`} label="Revenue"     accent="#9b59b6" icon="₨" />
      </div>

      {/* Row 2 — 3 cards */}
      <div className="stat-grid stat-grid--3">
        <StatCard badge="30%"       badgeDot="#2ecc71" value={`PKR ${Number(profit).toLocaleString()}`}   label="Est. profit"    accent="#2ecc71" icon="↗" />
        <StatCard badge="Accounts"  badgeDot="#4361ee" value={stats.totalUsers}                           label="Total customers" accent="#3498db" icon="👤" />
        <StatCard badge="Alert"     badgeDot="#f39c12" value={lowStock.length}                            label="Low stock items" accent="#f39c12" icon="!" alert={lowStock.length > 0} />
      </div>


      <div className="charts-row">
        <div className="chart-card">
          <h3>Revenue — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="day" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip formatter={(v) => `PKR ${v}`} contentStyle={{ background: '#fff', border: '1px solid #eee', borderRadius: 8 }} />
              <Line type="monotone" dataKey="revenue" stroke="#c9a96e" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Orders — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="day" stroke="#999" />
              <YAxis allowDecimals={false} stroke="#999" />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #eee', borderRadius: 8 }} />
              <Bar dataKey="orders" fill="#4361ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
