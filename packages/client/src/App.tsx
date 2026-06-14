import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Menu from './pages/Menu';
import ItemDetail from './pages/ItemDetail';
import Cart from './pages/Cart';
import Booking from './pages/Booking';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import BookingConfirmed from './pages/BookingConfirmed';
import Orders from './pages/Orders';
import Profile from './pages/Profile';

import Dashboard from './pages/admin/Dashboard';
import MenuManagement from './pages/admin/MenuManagement';
import AdminReservations from './pages/admin/Reservations';
import OrderManagement from './pages/admin/OrderManagement';
import Reports from './pages/admin/Reports';

function AdminLayout() {
  const location = useLocation();

  const links = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/menu', label: 'Menu Items' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/reservations', label: 'Reservations' },
    { to: '/admin/reports', label: 'Reports' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`admin-nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-link">
            &larr; Back to Site
          </Link>
        </div>
      </aside>
      <main className="admin-main">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (loading) {
    return (
      <div className="page-loading full">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <AdminRoute>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />} />
        </Routes>
      </AdminRoute>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:id" element={<ItemDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/checkout" element={
            <ProtectedRoute><Checkout /></ProtectedRoute>
          } />
          <Route path="/payment" element={
            <ProtectedRoute><Payment /></ProtectedRoute>
          } />
          <Route path="/booking-confirmed" element={
            <ProtectedRoute><BookingConfirmed /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><Orders /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
