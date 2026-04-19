import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ unreadCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  const isAdmin  = user.role === 'club_admin';
  const isSuperAdmin = user.role === 'central_admin';

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
              {link('/size-chart',     '📏',        'nav-size-chart')}
              <NavLink to="/notifications" className={({ isActive }) => `nav-link nav-badge${isActive ? ' active' : ''}`} id="nav-notifs">
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
          {link('/change-password', '🔒', 'nav-change-pass')}
          <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} id="nav-profile">
            <div className="nav-avatar" title={user.name}>{user.name?.[0]?.toUpperCase()}</div>
          </NavLink>
          <button id="logout-btn" className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
