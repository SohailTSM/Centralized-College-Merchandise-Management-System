import { useState } from 'react';
import { useToast } from '../hooks/useToast';
import api from '../services/api';

const ChangePasswordPage = () => {
  const { success, error, ToastContainer } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword)
      return error('New passwords do not match');
    if (form.newPassword.length < 6)
      return error('New password must be at least 6 characters');
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      success('Password changed successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 480 }}>
      <ToastContainer />
      <div className="page-header">
        <h1 className="page-title">🔒 Change Password</h1>
        <p className="page-subtitle">Update your account password</p>
      </div>
      <form className="card flex-col" onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input id="current-password" className="form-input" type="password" name="currentPassword" value={form.currentPassword} onChange={onChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input id="new-password" className="form-input" type="password" name="newPassword" value={form.newPassword} onChange={onChange} minLength={6} required />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input id="confirm-password" className="form-input" type="password" name="confirmPassword" value={form.confirmPassword} onChange={onChange} required />
        </div>
        <button id="change-password-btn" className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Updating…' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordPage;
