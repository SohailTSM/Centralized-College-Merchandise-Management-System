import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';

const AdminOrders = () => {
  const { success, error, ToastContainer } = useToast();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(null);

  // Student search
  const [searchQuery,   setSearchQuery]   = useState('');

  const fetchOrders = () =>
    api.get('/orders').then(({ data }) => setOrders(data)).catch(() => error('Load failed')).finally(() => setLoading(false));

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      success(`Order marked as ${status}`);
      fetchOrders();
      // Re-run search to refresh
      if (searchQuery.length >= 2) handleSearch();
    } catch (err) {
      error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredOrders = searchQuery.length >= 2
    ? orders.filter((o) => {
        const s = o.studentId;
        if (!s) return false;
        const q = searchQuery.toLowerCase();
        return (s.name?.toLowerCase().includes(q) ||
                s.email?.toLowerCase().includes(q) ||
                s.rollNumber?.toLowerCase().includes(q) ||
                s.mobile?.includes(q));
      })
    : orders;

  return (
    <div className="page">
      <ToastContainer />
      <div className="page-header">
        <h1 className="page-title">📋 Manage Orders</h1>
        <p className="page-subtitle">Track and update order statuses for your club</p>
      </div>

      {/* Student Search */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>🔍 Search by Student Name / Email / Roll Number / Mobile</p>
        <input
          id="student-search"
          className="form-input"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Type at least 2 characters…"
        />
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state"><h3>{searchQuery ? 'No matching orders found' : 'No orders yet'}</h3></div>
      ) : (
        <div className="flex-col">
          {filteredOrders.map((order) => (
            <div key={order._id} className="card">
              <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{order.studentId?.name || 'Student'}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{order.studentId?.email}</p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                    {order.studentId?.rollNumber && <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Roll: {order.studentId.rollNumber}</p>}
                    {order.studentId?.mobile && <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>📱 {order.studentId.mobile}</p>}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    #{order._id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge status-${order.status}`}>{order.status}</span>
                  <p style={{ fontWeight: 700, color: 'var(--primary-light)', marginTop: '0.5rem' }}>₹{order.totalAmount}</p>
                </div>
              </div>
              <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                {order.items.map((item, i) => (
                  <p key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {item.merchandiseId?.name || 'Item'} — Size: {item.size} × {item.quantity}
                    <span style={{ marginLeft: '0.5rem', color: 'var(--text-dim)' }}>(₹{item.price})</span>
                  </p>
                ))}
              </div>
              {order.status !== 'delivered' && (
                <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
                  <button id={`deliver-${order._id}`} className="btn btn-success btn-sm" disabled={updating === order._id} onClick={() => updateStatus(order._id, 'delivered')}>📦 Mark Delivered</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
