import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

const LoginPage = () => {
  const { login, loading } = useAuth();
  const { error, ToastContainer } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'central_admin') navigate('/superadmin');
      else if (user.role === 'club_admin') navigate('/admin/dashboard');
      else navigate('/catalog');
    } catch (err) {
      error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };


  return (
    <div className="auth-page">
      <ToastContainer />
      <div className="auth-card">
        <h1 className="auth-title gradient-text">Welcome Back</h1>
        <p className="auth-sub">Sign in to access your campus merchandise hub</p>
        <form className="flex-col" onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="login-email" className="form-input" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@college.edu" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" className="form-input" type="password" name="password" value={form.password} onChange={onChange} placeholder="••••••••" required />
          </div>
          <button id="login-btn" className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No account? <Link to="/register" style={{ color: 'var(--primary-light)' }}>Create one</Link>
        </p>

        <div className="demo-credentials">
          <p className="demo-title">Test Drive (Guest Access)</p>
          <div className="demo-grid">
            <div className="demo-item">
              <span className="demo-label">Student</span>
              <button 
                type="button"
                className="demo-btn" 
                onClick={() => setForm({ email: 'demo.user@ccmms.com', password: 'Demo@123' })}
              >
                Use Demo User
              </button>
            </div>
            <div className="demo-item">
              <span className="demo-label">Club Admin</span>
              <button 
                type="button"
                className="demo-btn" 
                onClick={() => setForm({ email: 'demo.club@ccmms.com', password: 'Demo@123' })}
              >
                Use Demo Admin
              </button>
            </div>
          </div>
          <p className="demo-note">Password: <code style={{ color: 'var(--text-primary)' }}>Demo@123</code></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
