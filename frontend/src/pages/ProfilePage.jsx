import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const ProfilePage = () => {
  const { user, updateUserLocally } = useAuth();
  const { success, error, ToastContainer } = useToast();
  const [form, setForm] = useState({
    name: user?.name || '',
    sizeProfile: user?.sizeProfile || { tshirt: 'M', hoodie: 'M', other: 'M' },
  });
  const [loading, setLoading] = useState(false);

  const onSizeChange = (key, val) =>
    setForm({ ...form, sizeProfile: { ...form.sizeProfile, [key]: val } });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUserLocally(data);
      success('Profile updated!');
    } catch {
      error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <ToastContainer />
      <div className="page-header">
        <h1 className="page-title">👤 My Profile</h1>
        <p className="page-subtitle">Update your name and size preferences</p>
      </div>
      <form className="card flex-col" onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input id="profile-name" className="form-input" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
        </div>
        <div>
          <p className="form-label" style={{ marginBottom: '0.75rem' }}>Size Preferences</p>
          {['tshirt', 'hoodie', 'other'].map((key) => (
            <div key={key} style={{ marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.35rem', textTransform: 'capitalize' }}>{key}</p>
              <div className="size-buttons">
                {SIZES.map((s) => (
                  <button key={s} type="button"
                    className={`size-btn${form.sizeProfile[key] === s ? ' selected' : ''}`}
                    onClick={() => onSizeChange(key, s)}>{s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button id="profile-save-btn" className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
