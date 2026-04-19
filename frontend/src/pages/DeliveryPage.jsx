import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const ONE_WEEK_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const fmtDateTime = (date) => {
  const d = new Date(date);
  const dd  = String(d.getDate()).padStart(2, '0');
  const mm  = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${dd}/${mm}/${yyyy}, ${hours}:${mins} ${ampm}`;
};

const DeliveryPage = () => {
  const { error, ToastContainer } = useToast();
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/delivery-slots')
      .then(({ data }) => {
        // Students: only show slots from last 7 days onwards, newest first
        const visible = data
          .filter((s) => new Date(s.scheduledAt) >= ONE_WEEK_AGO)
          .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
        setSlots(visible);
      })
      .catch(() => error('Failed to load delivery slots'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <ToastContainer />
      <div className="page-header">
        <h1 className="page-title">📍 Delivery Slots</h1>
        <p className="page-subtitle">Pickup locations scheduled by your clubs</p>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : slots.length === 0 ? (
        <div className="empty-state">
          <h3>No upcoming delivery slots</h3>
          <p>Your club managers will schedule pickup slots once orders are ready.</p>
        </div>
      ) : (
        <div className="grid-2">
          {slots.map((slot) => (
            <div key={slot._id} className="card">
              <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                <span className="badge badge-primary">{slot.clubId?.name || 'Club'}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {slot.merchandiseScope === 'all' ? 'All merchandise' : `${slot.merchandiseIds?.length || 0} item(s)`}
                </span>
              </div>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>📅 {fmtDateTime(slot.scheduledAt)}</p>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.375rem' }}>📌 {slot.location}</p>

              {/* Show what items are being delivered */}
              {slot.merchandiseScope === 'specific' && slot.merchandiseIds && slot.merchandiseIds.length > 0 ? (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.25rem', fontWeight: 600 }}>ITEMS BEING DELIVERED</p>
                  {slot.merchandiseIds.map((item) => (
                    <p key={item._id} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      · {item.name} <span style={{ opacity: 0.6 }}>({item.type})</span>
                    </p>
                  ))}
                </div>
              ) : slot.merchandiseScope === 'all' ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                  🎽 All merchandise from this club
                </p>
              ) : null}

              {slot.description && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  {slot.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryPage;
