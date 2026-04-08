import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          ☰
        </button>
        <Outlet />
      </main>
    </div>
  );
}
