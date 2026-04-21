import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'https://api.celestraa.com/api';

const api = axios.create({ baseURL: BASE, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dashToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('dashToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
