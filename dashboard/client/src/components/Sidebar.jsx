import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Sidebar.css';

const links = [
  { to: '/dashboard', label: '🏠 Home', end: true },
  { to: '/dashboard/orders', label: '📦 Orders' },
  { to: '/dashboard/products', label: '🛍️ Products' },
  { to: '/dashboard/customers', label: '👥 Customers' },
  { to: '/dashboard/sales', label: '💰 Sales & Finance' },
  { to: '/dashboard/alerts', label: '⚠️ Alerts' },
  { to: '/dashboard/contact-messages', label: '✉️ Contact Messages' },
  { to: '/dashboard/notifications', label: '🔔 Notifications', badge: true },
  { to: '/dashboard/settings', label: '⚙️ Settings' },
];

export default function Sidebar({ open, onClose }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/admin/notifications');
        setUnreadCount(data.filter((n) => !n.isRead).length);
      } catch (_) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleNavClick = () => { if (onClose) onClose(); };

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">💎</span>
          <span>Celestra Admin</span>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">✕</button>
        </div>
        <nav className="sidebar-nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={handleNavClick} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span>{l.label}</span>
              {l.badge && unreadCount > 0 && (
                <span className="notif-badge">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="admin-name">{admin?.email || 'Admin'}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </aside>
    </>
  );
}
