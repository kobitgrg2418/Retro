import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const close = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={close}>
          <svg className="brand-mountain" viewBox="0 0 80 40" aria-hidden="true">
            <path
              d="M2 37 L22 9 L31 21 L39 10 L50 25 L58 17 L78 37"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="brand-name">Gokyo Bistro</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </button>

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={close}>Home</Link>
          <Link to="/menu" className="nav-link" onClick={close}>Menu</Link>
          <Link to="/booking" className="nav-link" onClick={close}>Book a Table</Link>

          {isAuthenticated && (
            <>
              <Link to="/orders" className="nav-link" onClick={close}>My Orders</Link>
              {isAdmin && (
                <Link to="/admin" className="nav-link nav-link-admin" onClick={close}>Admin</Link>
              )}
            </>
          )}

          <Link to="/cart" className="nav-link cart-link" onClick={close} aria-label="Cart">
            <span className="cart-icon" aria-hidden="true">&#128722;</span>
            <span className="cart-text">Cart</span>
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>

          {isAuthenticated ? (
            <div className="nav-user">
              <Link to="/profile" className="nav-link" onClick={close}>
                {user?.name || 'Profile'}
              </Link>
              <button className="btn btn-sm btn-outline" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="nav-user">
              <Link to="/login" className="nav-link" onClick={close}>Login</Link>
              <Link to="/register" className="btn btn-sm btn-primary" onClick={close}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
