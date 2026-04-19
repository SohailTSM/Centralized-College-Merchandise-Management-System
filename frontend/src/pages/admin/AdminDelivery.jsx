import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';

// Format a Date as DD/MM/YYYY, HH:MM AM/PM
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

const ONE_MONTH_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

const SCOPE_OPTIONS = [
  { value: 'all',      label: 'All merchandise with processing orders' },
  { value: 'specific', label: 'Specific merchandise items' },
];

const AdminDelivery = () => {
  const { success, error, ToastContainer } = useToast();
  const [slots,           setSlots]          = useState([]);
  const [availableMerch,  setAvailableMerch]  = useState([]); // only merch with orders
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [showForm,        setShowForm]        = useState(false);
  const [showOldSlots,    setShowOldSlots]    = useState(false);
  const [activeSlot,      setActiveSlot]      = useState(null);
  const [slotOrders,      setSlotOrders]      = useState([]);
  const [loadingOrders,   setLoadingOrders]   = useState(false);
  const [orderQuery,      setOrderQuery]      = useState('');
  const [form, setForm] = useState({
    scheduledAt: '', location: '', description: '',
    merchandiseScope: 'all', merchandiseIds: [],
  });

  const fetchSlots    = () => api.get('/delivery-slots/mine').then(({ data }) => setSlots(data)).catch(() => error('Load failed')).finally(() => setLoading(false));
  const fetchMerch    = () => api.get('/delivery-slots/merch-with-orders').then(({ data }) => setAvailableMerch(data));

  useEffect(() => { fetchSlots(); fetchMerch(); }, []);

  const recentSlots = slots.filter((s) => new Date(s.scheduledAt) >= ONE_MONTH_AGO);
  const oldSlots    = slots.filter((s) => new Date(s.scheduledAt) < ONE_MONTH_AGO);

  const toggleMerch = (id) => setForm((f) => {
    const ids = f.merchandiseIds.includes(id) ? f.merchandiseIds.filter((x) => x !== id) : [...f.merchandiseIds, id];
    return { ...f, merchandiseIds: ids };
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.location.trim()) return error('Location is required');
    if (!form.scheduledAt)     return error('Date & Time is required');
    if (form.merchandiseScope === 'specific' && form.merchandiseIds.length === 0)
      return error('Please select at least one merchandise item');
    setSaving(true);
    try {
      await api.post('/delivery-slots', form);
      success('Delivery slot created! Buyers of covered merchandise have been notified.');
      setForm({ scheduledAt: '', location: '', description: '', merchandiseScope: 'all', merchandiseIds: [] });
      setShowForm(false);
      fetchSlots();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create slot');
    } finally {
      setSaving(false);
    }
  };

  const viewOrders = async (slot) => {
    setActiveSlot(slot);
    setOrderQuery(''); // clear query when opening a new slot
    setLoadingOrders(true);
    try {
      const { data } = await api.get(`/delivery-slots/${slot._id}/orders`);
      setSlotOrders(data);
    } catch { error('Failed to load orders'); }
    finally { setLoadingOrders(false); }
  };

  const markDelivered = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'delivered' });
      success('Order marked as delivered!');
      viewOrders(activeSlot);
    } catch (err) { error(err.response?.data?.message || 'Update failed'); }
  };

  const SlotCard = ({ slot }) => (
    <div key={slot._id} className="card" style={{ cursor: 'pointer' }} onClick={() => viewOrders(slot)}>
      <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
        <span className="badge badge-primary">
          {slot.merchandiseScope === 'all' ? '✦ All Orders' : `${slot.merchandiseIds?.length || 0} item(s)`}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Click to manage →</span>
      </div>
      <p style={{ fontWeight: 600 }}>{fmtDateTime(slot.scheduledAt)}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>📌 {slot.location}</p>
      {slot.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>{slot.description}</p>}
    </div>
  );

  // Filter orders locally
  const filteredSlotOrders = slotOrders.filter(o => 
    !orderQuery || 
    (o.studentId?.name || '').toLowerCase().includes(orderQuery.toLowerCase()) ||
    (o.studentId?.email || '').toLowerCase().includes(orderQuery.toLowerCase()) ||
    (o.studentId?.rollNumber || '').toLowerCase().includes(orderQuery.toLowerCase()) ||
    (o.studentId?.mobile || '').includes(orderQuery)
  );

  // ── Slot orders panel ──────────────────────────────────────────────────────
  if (activeSlot) return (
    <div className="page">
      <ToastContainer />
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">📦 Orders for Slot</h1>
          <p className="page-subtitle">{fmtDateTime(activeSlot.scheduledAt)} · {activeSlot.location}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setActiveSlot(null); setSlotOrders([]); setOrderQuery(''); }}>← Back</button>
      </div>
      
      {/* Search orders in slot */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>🔍 Filter student processing orders</p>
        <input
          className="form-input"
          value={orderQuery}
          onChange={(e) => setOrderQuery(e.target.value)}
          placeholder="Filter by Name, Email, Roll Number..."
        />
      </div>

      {loadingOrders ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : slotOrders.length === 0 ? (
        <div className="empty-state"><h3>No processing orders for this slot</h3></div>
      ) : filteredSlotOrders.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <p>No matches found in this slot.</p>
        </div>
      ) : (
        <div className="flex-col">
          {filteredSlotOrders.map((order) => (
            <div key={order._id} className="card">
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{order.studentId?.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {order.studentId?.email} · Roll: {order.studentId?.rollNumber || '—'} · 📱 {order.studentId?.mobile || '—'}
                  </p>
                </div>
                <div className="flex-gap">
                  <span className="badge status-processing">processing</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹{order.totalAmount}</span>
                </div>
              </div>
              <div style={{ padding: '0.5rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                {order.items.map((item, i) => (
                  <p key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {item.merchandiseId?.name} — {item.merchandiseId?.type} — Size: {item.size} × {item.quantity}
                  </p>
                ))}
              </div>
              <button id={`deliver-${order._id}`} className="btn btn-success btn-sm" onClick={() => markDelivered(order._id)}>
                📦 Mark Delivered
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="page">
      <ToastContainer />
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">🚚 Delivery Slots</h1>
          <p className="page-subtitle">All buyers of covered merchandise are auto-notified on slot creation</p>
        </div>
        <button id="add-slot-btn" className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Slot</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700 }}>Create Delivery Slot</h2>
          <form className="flex-col" onSubmit={onSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Location</label>
                <input id="slot-location" className="form-input" value={form.location}
                  placeholder="e.g. In Warehouse, Near Admin Block / SAC Ground Floor"
                  onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input id="slot-datetime" className="form-input" type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />
                {form.scheduledAt && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    📅 {fmtDateTime(form.scheduledAt)}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Merchandise Scope</label>
                <select id="slot-scope" className="form-select" value={form.merchandiseScope}
                  onChange={(e) => setForm({ ...form, merchandiseScope: e.target.value, merchandiseIds: [] })}>
                  {SCOPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {form.merchandiseScope === 'specific' && (
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Select Merchandise (with processing orders only)</label>
                  {availableMerch.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>No merchandise with processing orders</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.375rem' }}>
                      {availableMerch.map((item) => (
                        <button key={item._id} type="button"
                          className={`filter-chip${form.merchandiseIds.includes(item._id) ? ' active' : ''}`}
                          onClick={() => toggleMerch(item._id)}>
                          {item.name} <span style={{ opacity: 0.6 }}>({item.processingCount} orders)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" value={form.description}
                  placeholder="Any additional pickup instructions…"
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex-gap">
              <button id="save-slot-btn" className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Slot'}</button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {/* Recent slots (≤ 1 month) */}
          {recentSlots.length === 0 && <div className="empty-state"><h3>No recent delivery slots</h3><p>Create a slot to notify students.</p></div>}
          <div className="grid-2">
            {recentSlots.map((slot) => <SlotCard key={slot._id} slot={slot} />)}
          </div>

          {/* Old slots (> 1 month) — collapsible */}
          {oldSlots.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <button id="old-slots-btn" className="btn btn-secondary btn-sm" onClick={() => setShowOldSlots((v) => !v)}>
                {showOldSlots ? '▲ Hide Old Slots' : `▼ Old Slots (${oldSlots.length})`}
              </button>
              {showOldSlots && (
                <div className="grid-2" style={{ marginTop: '1rem', opacity: 0.65 }}>
                  {oldSlots.map((slot) => <SlotCard key={slot._id} slot={slot} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDelivery;
