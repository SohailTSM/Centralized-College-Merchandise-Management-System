import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';

const TYPES = ['tshirt', 'hoodie', 'cap', 'mug'];

const SIZE_OPTIONS = {
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  hoodie: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  cap:    ['Standard'],
  mug:    ['Standard'],
};

const DEFAULT_SIZES = {
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  hoodie: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  cap:    ['Standard'],
  mug:    ['Standard'],
};

const blank = { name: '', type: 'tshirt', price: '', description: '', availableSizes: DEFAULT_SIZES['tshirt'], imageUrl: '' };

const AdminListings = () => {
  const { success, error, ToastContainer } = useToast();
  const [items,        setItems]       = useState([]);
  const [form,         setForm]        = useState(blank);
  const [editing,      setEditing]     = useState(null);
  const [showForm,     setShowForm]    = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [loading,      setLoading]     = useState(true);
  const [saving,       setSaving]      = useState(false);

  const fetchItems = () =>
    api.get('/merchandise/club/mine')
      .then(({ data }) => setItems(data))
      .catch(() => error('Load failed'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchItems(); }, []);

  const toggleSize = (s) =>
    setForm((f) => ({
      ...f,
      availableSizes: f.availableSizes.includes(s)
        ? f.availableSizes.filter((x) => x !== s)
        : [...f.availableSizes, s],
    }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      if (editing) {
        await api.put(`/merchandise/${editing}`, payload);
        success('Listing updated!');
      } else {
        await api.post('/merchandise', payload);
        success('Listing created!');
      }
      setForm(blank); setEditing(null); setShowForm(false);
      fetchItems();
    } catch (err) {
      error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setForm({
      name: item.name, type: item.type, price: String(item.price),
      description: item.description || '', availableSizes: item.availableSizes || [], imageUrl: item.imageUrl || '',
    });
    setEditing(item._id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reactivate = async (item) => {
    try {
      await api.patch(`/merchandise/${item._id}/status`);
      success(`"${item.name}" reactivated!`);
      fetchItems();
    } catch { error('Update failed'); }
  };

  const deactivate = async (item) => {
    try {
      await api.patch(`/merchandise/${item._id}/status`);
      success(`"${item.name}" deactivated`);
      fetchItems();
    } catch { error('Update failed'); }
  };

  // Active: show all, sorted newest first (DB order)
  const activeItems   = items.filter((i) => i.isActive);
  // Inactive: newest (last entered) first
  const inactiveItems = items.filter((i) => !i.isActive);

  return (
    <div className="page">
      <ToastContainer />

      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">🏷️ My Listings</h1>
          <p className="page-subtitle">{activeItems.length} active · {inactiveItems.length} inactive</p>
        </div>
        <button id="add-listing-btn" className="btn btn-primary"
          onClick={() => { setForm(blank); setEditing(null); setShowForm(!showForm); }}>
          {showForm ? '✕ Close' : '+ New Listing'}
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 700 }}>
            {editing ? 'Edit Listing' : 'Create New Listing'}
          </h2>
          <form className="flex-col" onSubmit={onSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input id="listing-name" className="form-input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select id="listing-type" className="form-select" value={form.type}
                  onChange={(e) => {
                    const t = e.target.value;
                    setForm({ ...form, type: t, availableSizes: DEFAULT_SIZES[t] || [] });
                  }}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input id="listing-price" className="form-input" type="number" min="0"
                  value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL (optional)</label>
                <input className="form-input" value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <p className="form-label" style={{ marginBottom: '0.5rem' }}>Available Sizes</p>
              {['cap', 'mug'].includes(form.type) ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Standard (fixed for {form.type})</p>
              ) : (
                <div className="size-buttons">
                  {SIZE_OPTIONS[form.type]?.map((s) => (
                    <button key={s} type="button"
                      className={`size-btn${form.availableSizes.includes(s) ? ' selected' : ''}`}
                      onClick={() => toggleSize(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-gap">
              <button id="save-listing-btn" className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
              <button className="btn btn-secondary" type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>No listings yet</h3>
          <p>Create your first merchandise listing above.</p>
        </div>
      ) : (
        <>
          {/* ── Active Listings ──────────────────────────────────────── */}
          {activeItems.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <p>No active listings. Reactivate an old listing or create a new one.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Type</th><th>Price</th><th>Sizes</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeItems.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td><span className="badge badge-muted">{item.type}</span></td>
                      <td>₹{item.price}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {(item.availableSizes || []).join(', ')}
                      </td>
                      <td>
                        <div className="flex-gap">
                          <button id={`edit-btn-${item._id}`} className="btn btn-secondary btn-sm"
                            onClick={() => startEdit(item)}>Edit</button>
                          <button id={`deactivate-btn-${item._id}`} className="btn btn-danger btn-sm"
                            onClick={() => deactivate(item)}>Deactivate</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Inactive / Old Listings — collapsible ──────────────── */}
          {inactiveItems.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <button
                id="old-listings-btn"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowInactive((v) => !v)}
              >
                {showInactive
                  ? '▲ Hide Old Listings'
                  : `▼ Old Listings (${inactiveItems.length})`}
              </button>

              {showInactive && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="table-wrap" style={{ opacity: 0.75 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th><th>Type</th><th>Price</th><th>Sizes</th><th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inactiveItems.map((item) => (
                          <tr key={item._id}>
                            <td style={{ fontWeight: 500, textDecoration: 'line-through', opacity: 0.7 }}>
                              {item.name}
                            </td>
                            <td><span className="badge badge-muted">{item.type}</span></td>
                            <td>₹{item.price}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {(item.availableSizes || []).join(', ')}
                            </td>
                            <td>
                              <button
                                id={`reactivate-btn-${item._id}`}
                                className="btn btn-success btn-sm"
                                onClick={() => reactivate(item)}
                              >
                                Reactivate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminListings;
