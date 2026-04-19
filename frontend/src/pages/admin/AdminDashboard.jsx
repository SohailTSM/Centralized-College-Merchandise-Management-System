import { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminDashboard = () => {
  const [orders,  setOrders]  = useState([]);
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/orders'),
      api.get('/merchandise/club/mine'),
    ]).then(([o, m]) => {
      setOrders(o.data);
      setItems(m.data);
    }).finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const pending      = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📊 Club Dashboard</h1>
        <p className="page-subtitle">Overview of your club's merchandise activity</p>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="card stat-card">
              <p className="stat-number">{items.length}</p>
              <p className="stat-label">Active Listings</p>
            </div>
            <div className="card stat-card">
              <p className="stat-number">{orders.length}</p>
              <p className="stat-label">Total Orders</p>
            </div>
            <div className="card stat-card">
              <p className="stat-number">{pending}</p>
              <p className="stat-label">Pending Orders</p>
            </div>
            <div className="card stat-card">
              <p className="stat-number gradient-text">₹{totalRevenue.toLocaleString()}</p>
              <p className="stat-label">Total Revenue</p>
            </div>
          </div>

          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Recent Orders</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Student</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o._id}>
                    <td>{o.studentId?.name || '—'}</td>
                    <td>{o.items.length} item(s)</td>
                    <td>₹{o.totalAmount}</td>
                    <td><span className={`badge status-${o.status}`}>{o.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
