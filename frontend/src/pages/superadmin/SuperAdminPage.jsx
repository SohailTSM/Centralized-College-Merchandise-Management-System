import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';

const SuperAdminPage = () => {
  const { success, error, ToastContainer } = useToast();

  // Clubs
  const [clubs,      setClubs]      = useState([]);
  const [managers,   setManagers]   = useState([]);
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('clubs');

  // Club form
  const [showClubForm, setShowClubForm] = useState(false);
  const [clubForm, setClubForm] = useState({ name: '', description: '', logoUrl: '' });
  const [savingClub, setSavingClub] = useState(false);

  // Manager form
  const [showMgrForm, setShowMgrForm] = useState(false);
  const [mgrForm, setMgrForm] = useState({ name: '', email: '', password: '', clubId: '' });
  const [savingMgr, setSavingMgr] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, m, s] = await Promise.all([
        api.get('/admin/clubs'),
        api.get('/admin/club-managers'),
        api.get('/admin/students'),
      ]);
      setClubs(c.data);
      setManagers(m.data);
      setStudents(s.data);
    } catch { error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const createClub = async (e) => {
    e.preventDefault();
    setSavingClub(true);
    try {
      await api.post('/admin/clubs', clubForm);
      success('Club created!');
      setClubForm({ name: '', description: '', logoUrl: '' }); setShowClubForm(false);
      fetchAll();
    } catch (err) { error(err.response?.data?.message || 'Failed'); }
    finally { setSavingClub(false); }
  };

  const deleteClub = async (id) => {
    if (!window.confirm('Delete this club? This cannot be undone.')) return;
    try { await api.delete(`/admin/clubs/${id}`); success('Club deleted'); fetchAll(); }
    catch { error('Delete failed'); }
  };

  const createManager = async (e) => {
    e.preventDefault();
    setSavingMgr(true);
    try {
      await api.post('/admin/club-managers', mgrForm);
      success('Club manager account created!');
      setMgrForm({ name: '', email: '', password: '', clubId: '' }); setShowMgrForm(false);
      fetchAll();
    } catch (err) { error(err.response?.data?.message || 'Failed'); }
    finally { setSavingMgr(false); }
  };

  const deleteManager = async (id) => {
    if (!window.confirm('Delete this manager account?')) return;
    try { await api.delete(`/admin/club-managers/${id}`); success('Manager deleted'); fetchAll(); }
    catch { error('Delete failed'); }
  };

  return (
    <div className="page">
      <ToastContainer />
      <div className="page-header">
        <h1 className="page-title">⚙️ Central Admin Panel</h1>
        <p className="page-subtitle">Manage all clubs, club managers, and student accounts</p>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card"><p className="stat-number">{clubs.length}</p><p className="stat-label">Clubs</p></div>
        <div className="card stat-card"><p className="stat-number">{managers.length}</p><p className="stat-label">Club Managers</p></div>
        <div className="card stat-card"><p className="stat-number">{students.length}</p><p className="stat-label">Students</p></div>
      </div>

      {/* Tab bar */}
      <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
        {[['clubs','🏛️ Clubs'], ['managers','👤 Club Managers'], ['students', '🎓 Students']].map(([t, label]) => (
          <button key={t} className={`filter-chip${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {/* ── Clubs Tab ─────────────────────────────────────────── */}
          {tab === 'clubs' && (
            <>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontWeight: 700 }}>Clubs</h2>
                <button id="add-club-btn" className="btn btn-primary btn-sm" onClick={() => setShowClubForm(true)}>+ New Club</button>
              </div>
              {showClubForm && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <form className="flex-col" onSubmit={createClub}>
                    <div className="form-group">
                      <label className="form-label">Club Name</label>
                      <input id="club-name" className="form-input" value={clubForm.name} onChange={(e) => setClubForm({...clubForm, name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-textarea" value={clubForm.description} onChange={(e) => setClubForm({...clubForm, description: e.target.value})} />
                    </div>
                    <div className="flex-gap">
                      <button id="save-club-btn" className="btn btn-primary" type="submit" disabled={savingClub}>{savingClub ? 'Creating…' : 'Create Club'}</button>
                      <button className="btn btn-secondary" type="button" onClick={() => setShowClubForm(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}
              {clubs.length === 0 ? <div className="empty-state"><h3>No clubs yet</h3></div> : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Description</th><th>Manager</th><th>Actions</th></tr></thead>
                    <tbody>
                      {clubs.map((club) => (
                        <tr key={club._id}>
                          <td style={{ fontWeight: 600 }}>{club.name}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{club.description || '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{club.adminId?.name || <span style={{ color: 'var(--warning)' }}>No manager</span>}</td>
                          <td>
                            <button id={`del-club-${club._id}`} className="btn btn-danger btn-sm" onClick={() => deleteClub(club._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── Managers Tab ────────────────────────────────────────── */}
          {tab === 'managers' && (
            <>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontWeight: 700 }}>Club Managers</h2>
                <button id="add-mgr-btn" className="btn btn-primary btn-sm" onClick={() => setShowMgrForm(true)}>+ Add Manager</button>
              </div>
              {showMgrForm && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <form className="flex-col" onSubmit={createManager}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input id="mgr-name" className="form-input" value={mgrForm.name} onChange={(e) => setMgrForm({...mgrForm, name: e.target.value})} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input id="mgr-email" className="form-input" type="email" value={mgrForm.email} onChange={(e) => setMgrForm({...mgrForm, email: e.target.value})} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Password</label>
                        <input id="mgr-password" className="form-input" type="password" value={mgrForm.password} onChange={(e) => setMgrForm({...mgrForm, password: e.target.value})} minLength={6} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Assign to Club</label>
                        <select id="mgr-club" className="form-select" value={mgrForm.clubId} onChange={(e) => setMgrForm({...mgrForm, clubId: e.target.value})} required>
                          <option value="">Select a club…</option>
                          {clubs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex-gap">
                      <button id="save-mgr-btn" className="btn btn-primary" type="submit" disabled={savingMgr}>{savingMgr ? 'Creating…' : 'Create Manager'}</button>
                      <button className="btn btn-secondary" type="button" onClick={() => setShowMgrForm(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}
              {managers.length === 0 ? <div className="empty-state"><h3>No managers yet</h3></div> : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Club</th><th>Actions</th></tr></thead>
                    <tbody>
                      {managers.map((mgr) => {
                        const club = clubs.find((c) => String(c._id) === String(mgr.clubId));
                        return (
                          <tr key={mgr._id}>
                            <td style={{ fontWeight: 500 }}>{mgr.name}</td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{mgr.email}</td>
                            <td><span className="badge badge-primary">{club?.name || '—'}</span></td>
                            <td>
                              <button id={`del-mgr-${mgr._id}`} className="btn btn-danger btn-sm" onClick={() => deleteManager(mgr._id)}>Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── Students Tab ─────────────────────────────────────────── */}
          {tab === 'students' && (
            <>
              <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Registered Students</h2>
              {students.length === 0 ? <div className="empty-state"><h3>No students registered yet</h3></div> : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Roll Number</th><th>Mobile</th><th>Joined</th></tr></thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s._id}>
                          <td style={{ fontWeight: 500 }}>{s.name}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.email}</td>
                          <td style={{ fontSize: '0.85rem' }}>{s.rollNumber || '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{s.mobile || '—'}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SuperAdminPage;
