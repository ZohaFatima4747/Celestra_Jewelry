import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api';
import './Sales.css';

export default function Sales() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/sales').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading sales data...</div>;

  return (
    <div className="sales-page">
      <h2 className="page-title">Sales & Finance</h2>

      <div className="finance-kpis">
        <div className="fin-card">
          <span className="fin-icon">💰</span>
          <div>
            <div className="fin-val">PKR {data.totalRevenue?.toLocaleString()}</div>
            <div className="fin-label">Total Revenue</div>
          </div>
        </div>
        <div className="fin-card profit">
          <span className="fin-icon">📈</span>
          <div>
            <div className="fin-val">PKR {data.totalProfit?.toLocaleString()}</div>
            <div className="fin-label">Est. Profit (30%)</div>
          </div>
        </div>
        <div className="fin-card loss">
          <span className="fin-icon">📉</span>
          <div>
            <div className="fin-val">PKR {(data.totalRevenue * 0.7)?.toLocaleString()}</div>
            <div className="fin-label">Est. Cost (70%)</div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card wide">
          <h3>Monthly Revenue & Profit</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.monthlyData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a96e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c9a96e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2ecc71" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v) => `PKR ${v?.toLocaleString()}`} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#c9a96e" fill="url(#rev)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" stroke="#2ecc71" fill="url(#prof)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card">
        <h3>Monthly Revenue Bar</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => `PKR ${v?.toLocaleString()}`} />
            <Bar dataKey="revenue" fill="#4361ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
