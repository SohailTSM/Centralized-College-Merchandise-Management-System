import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const RegisterPage = () => {
  const { register, loading } = useAuth();
  const { error, ToastContainer } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', rollNumber: '', mobile: '',
    sizeProfile: { tshirt: 'M', hoodie: 'M', other: 'M' },
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSizeChange = (key, val) => setForm({ ...form, sizeProfile: { ...form.sizeProfile, [key]: val } });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) return error('Mobile number must be exactly 10 digits');
    try {
      await register(form);
      navigate('/catalog');
    } catch (err) {
      error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <ToastContainer />
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <h1 className="auth-title gradient-text">Join CCMMS</h1>
        <p className="auth-sub">Create your student profile — save your sizes once, order everywhere</p>
        <form className="flex-col" onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Full Name</label>
              <input id="reg-name" className="form-input" name="name" value={form.name} onChange={onChange} placeholder="Alex Kumar" required />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Email</label>
              <input id="reg-email" className="form-input" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@college.edu" required />
            </div>
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input id="reg-roll" className="form-input" name="rollNumber" value={form.rollNumber} onChange={onChange} placeholder="e.g. CS22B001" required />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile</label>
              <input id="reg-mobile" className="form-input" name="mobile" value={form.mobile} onChange={onChange} placeholder="10-digit number" maxLength={10} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Password</label>
              <input id="reg-password" className="form-input" type="password" name="password" value={form.password} onChange={onChange} placeholder="Min 6 characters" minLength={6} required />
            </div>
          </div>

          {/* Size Preferences */}
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>Your Size Preferences <span style={{ fontWeight: 400 }}>(saves time on every order)</span></p>
            {['tshirt', 'hoodie'].map((key) => (
              <div key={key} style={{ marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem', textTransform: 'capitalize' }}>{key}</p>
                <div className="size-buttons">
                  {SIZES.map((s) => (
                    <button key={s} type="button" className={`size-btn${form.sizeProfile[key] === s ? ' selected' : ''}`} onClick={() => onSizeChange(key, s)}>{s}</button>
                  ))}
                </div>
              </div>
            ))}
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
              📏 Not sure of your size? Check the <Link to="/size-chart" style={{ color: 'var(--primary-light)' }}>Size Chart</Link>
            </p>
          </div>

          <button id="reg-btn" className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary-light)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
