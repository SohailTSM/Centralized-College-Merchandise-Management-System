import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, totalAmount } = location.state || {};
  const [step, setStep] = useState('confirm'); // confirm | processing | done
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  if (!items || !totalAmount) {
    navigate('/catalog', { replace: true });
    return null;
  }

  const handlePay = async () => {
    setStep('processing');
    setError('');
    try {
      // Simulate payment processing (1.5s delay)
      await new Promise((r) => setTimeout(r, 1500));
      // Place order
      const { data } = await api.post('/orders', { items, totalAmount });
      setOrder(data);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed, please try again');
      setStep('confirm');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        {step === 'confirm' && (
          <>
            <h1 className="auth-title">💳 Checkout</h1>
            <p className="auth-sub">Review your order before paying</p>
            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.5rem' }}>
              {items.map((item, i) => (
                <div key={i} className="flex-between" style={{ padding: '0.4rem 0', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Size: {item.size} · Qty: {item.quantity}</p>
                  </div>
                  <p style={{ fontWeight: 600 }}>₹{item.price}</p>
                </div>
              ))}
              <div className="flex-between" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontWeight: 700 }}>Total</p>
                <p style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: '1.1rem' }}>₹{totalAmount}</p>
              </div>
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.875rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>💡 This is a simulated payment. No real transaction will occur.</p>
            </div>
            <button id="pay-btn" className="btn btn-primary btn-lg btn-full" onClick={handlePay}>
              Pay ₹{totalAmount} →
            </button>
          </>
        )}

        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Processing Payment…</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Please do not close this window</p>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Payment Successful!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Your order has been placed and confirmed.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '2rem' }}>
              Order: #{order?._id?.slice(-8).toUpperCase()} · ₹{totalAmount}
            </p>
            <button id="view-orders-btn" className="btn btn-primary btn-full" onClick={() => navigate('/my-orders')}>View My Orders</button>
            <button className="btn btn-secondary btn-full" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/catalog')}>Continue Shopping</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
