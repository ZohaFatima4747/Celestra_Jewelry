import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Login.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/v1/auth/login', form);
      const { token, userId } = res.data;
      // Decode role from token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'admin') {
        setError('Access denied. Admin accounts only.');
        setLoading(false);
        return;
      }
      login(token, { email: form.email, id: userId, role: payload.role });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">💎</div>
        <h1>Celestra Admin</h1>
        <p className="login-sub">Sign in to your dashboard</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email" placeholder="Admin email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password" placeholder="Password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
}
