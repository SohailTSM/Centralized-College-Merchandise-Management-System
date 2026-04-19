import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useToast } from './hooks/useToast';

import Navbar             from './components/Navbar';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import CatalogPage        from './pages/CatalogPage';
import PaymentPage        from './pages/PaymentPage';
import MyOrdersPage       from './pages/MyOrdersPage';
import NotificationsPage  from './pages/NotificationsPage';
import ProfilePage        from './pages/ProfilePage';
import DeliveryPage       from './pages/DeliveryPage';
import SizeChartPage      from './pages/SizeChartPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminListings  from './pages/admin/AdminListings';
import AdminOrders    from './pages/admin/AdminOrders';
import AdminDelivery  from './pages/admin/AdminDelivery';

import SuperAdminPage from './pages/superadmin/SuperAdminPage';

// ─── Route Guards ──────────────────────────────────────────────────────────────
const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const RequireRole = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (Array.isArray(role) ? !role.includes(user.role) : user.role !== role) {
    if (user.role === 'central_admin') return <Navigate to="/superadmin" replace />;
    if (user.role === 'club_admin')    return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/catalog" replace />;
  }
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'central_admin') return <Navigate to="/superadmin" replace />;
  if (user.role === 'club_admin')    return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/catalog" replace />;
};

// ─── App Shell ────────────────────────────────────────────────────────────────
const AppShell = () => {
  const { ToastContainer } = useToast();

  return (
    <BrowserRouter>
      <ToastContainer />
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/register"   element={<RegisterPage />} />
        <Route path="/size-chart" element={<SizeChartPage />} />

        {/* Shared (any logged-in) */}
        <Route path="/profile"         element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/change-password" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />

        {/* Student */}
        <Route path="/catalog"       element={<RequireRole role="student"><CatalogPage /></RequireRole>} />
        <Route path="/payment"       element={<RequireRole role="student"><PaymentPage /></RequireRole>} />
        <Route path="/my-orders"     element={<RequireRole role="student"><MyOrdersPage /></RequireRole>} />
        <Route path="/notifications" element={<RequireRole role="student"><NotificationsPage /></RequireRole>} />
        <Route path="/delivery"      element={<RequireRole role="student"><DeliveryPage /></RequireRole>} />

        {/* Club Admin */}
        <Route path="/admin/dashboard" element={<RequireRole role="club_admin"><AdminDashboard /></RequireRole>} />
        <Route path="/admin/listings"  element={<RequireRole role="club_admin"><AdminListings /></RequireRole>} />
        <Route path="/admin/orders"    element={<RequireRole role="club_admin"><AdminOrders /></RequireRole>} />
        <Route path="/admin/delivery"  element={<RequireRole role="club_admin"><AdminDelivery /></RequireRole>} />

        {/* Central Admin */}
        <Route path="/superadmin" element={<RequireRole role="central_admin"><SuperAdminPage /></RequireRole>} />

        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <AuthProvider>
    <AppShell />
  </AuthProvider>
);

export default App;
