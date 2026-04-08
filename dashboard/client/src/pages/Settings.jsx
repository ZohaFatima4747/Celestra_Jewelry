import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Settings.css';

export default function Settings() {
  const { admin } = useAuth();
  const [form, setForm] = useState({ name: admin?.name || '', email: admin?.email || '', password: '', confirmPassword: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    if (form.password && form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;
      await api.put(`/v1/auth/user/${admin?.id}`, payload);
      setMsg('Profile updated successfully.');
      setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <h2 className="page-title">Settings</h2>

      <div className="settings-card">
        <h3>Admin Profile</h3>
        {msg && <div className="success-msg">{msg}</div>}
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSave} className="settings-form">
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Admin name" />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Admin email" required />
          </label>
          <label>
            <span>New Password</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current" />
          </label>
          <label>
            <span>Confirm Password</span>
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Confirm new password" />
          </label>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>

      <div className="settings-card">
        <h3>Role Management</h3>
        <p className="role-info">
          The admin role is assigned directly in the database via the <code>role</code> field on the Contact model.
          Set <code>role: "admin"</code> for any user to grant dashboard access.
        </p>
        <div className="role-badge">Your role: <strong>admin</strong></div>
      </div>
    </div>
  );
}
