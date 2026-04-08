import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import DashboardHome from './pages/DashboardHome';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            <Route index element={<DashboardHome />} />
            <Route path="orders" element={<Orders />} />
            <Route path="products" element={<Products />} />
            <Route path="customers" element={<Customers />} />
            <Route path="sales" element={<Sales />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
