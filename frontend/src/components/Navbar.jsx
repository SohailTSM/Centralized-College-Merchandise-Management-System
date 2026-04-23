import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin  = user?.role === 'club_admin';
  const isSuperAdmin = user?.role === 'central_admin';

  const fetchUnread = () => {
    if (user && !isAdmin && !isSuperAdmin) {
      api.get('/notifications')
        .then(({ data }) => setUnreadCount(data.filter((n) => !n.isRead).length))
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchUnread();
    window.addEventListener('notificationsUpdated', fetchUnread);
    return () => window.removeEventListener('notificationsUpdated', fetchUnread);
  }, [user, isAdmin, isSuperAdmin]);

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  const link = (to, label, id) => (
    <NavLink id={id} to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{label}</NavLink>
  );

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <NavLink to="/" className="nav-brand">🎓 CCMMS</NavLink>
        <div className="nav-links">
          {/* Student */}
          {!isAdmin && !isSuperAdmin && (
            <>
              {link('/catalog',        'Catalog',   'nav-catalog')}
              {link('/my-orders',      'My Orders', 'nav-orders')}
              {link('/delivery',       'Delivery',  'nav-delivery')}
              <NavLink id="nav-size-chart" to="/size-chart" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} title="Size Chart">📏</NavLink>
              <NavLink to="/notifications" className={({ isActive }) => `nav-link nav-badge${isActive ? ' active' : ''}`} id="nav-notifs" title="Notifications">
                🔔 {unreadCount > 0 && <span className="nav-badge-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </NavLink>
            </>
          )}
          {/* Club Admin */}
          {isAdmin && (
            <>
              {link('/admin/dashboard', 'Dashboard',  'nav-dashboard')}
              {link('/admin/listings',  'Listings',   'nav-listings')}
              {link('/admin/orders',    'Orders',     'nav-admin-orders')}
              {link('/admin/delivery',  'Delivery',   'nav-admin-delivery')}
            </>
          )}
          {/* Central Admin */}
          {isSuperAdmin && (
            <>
              {link('/superadmin',     '⚙ Admin Panel', 'nav-superadmin')}
            </>
          )}
          {/* Shared */}
          <NavLink id="nav-change-pass" to="/change-password" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} title="Change Password">🔒</NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} id="nav-profile" title="View Profile">
            <div className="nav-avatar" title={user.name}>{user.name?.[0]?.toUpperCase()}</div>
          </NavLink>
          <button id="logout-btn" className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
