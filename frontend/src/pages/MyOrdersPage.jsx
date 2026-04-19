import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const STATUS_INFO = {
  processing: { label: 'Processing',  cls: 'badge status-processing', icon: '⏳' },
  delivered:  { label: 'Delivered',   cls: 'badge status-delivered',  icon: '📦' },
};

const MyOrdersPage = () => {
  const { error, ToastContainer } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my')
      .then(({ data }) => setOrders(data))
      .catch(() => error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <ToastContainer />
      <div className="page-header">
        <h1 className="page-title">📦 My Orders</h1>
        <p className="page-subtitle">{orders.length} total orders</p>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>Head to the catalog to place your first order!</p>
        </div>
      ) : (
        <div className="flex-col">
          {orders.map((order) => {
            const info = STATUS_INFO[order.status] || STATUS_INFO.processing;
            return (
              <div key={order._id} className="card">
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="flex-gap">
                    <span className={info.cls}>{info.icon} {info.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹{order.totalAmount}</span>
                  </div>
                </div>
                <div className="flex-col" style={{ gap: '0.5rem' }}>
                  {order.items.map((item, i) => (
                    <div key={i} className="flex-between" style={{ padding: '0.5rem 0', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                      <div className="flex-gap">
                        <span style={{ fontSize: '1.5rem' }}>🎽</span>
                        <div>
                          <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.merchandiseId?.name || 'Item'}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Size: {item.size} · Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p style={{ fontWeight: 600 }}>₹{item.price}</p>
                    </div>
                  ))}
                </div>
                {order.status === 'delivered' && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '0.8rem', color: '#34d399' }}>✅ Delivered — Thank you! Enjoy your merchandise.</p>
                  </div>
                )}
                {order.status === 'processing' && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏳ Your order is being processed. Check the Delivery page for pickup slot updates.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
