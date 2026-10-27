import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.js';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" onClick={closeMenu}>GigMatch 🎷</Link>
      </div>

      {/* Hamburger Toggle Button for Mobile */}
      <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Navigation Links */}
      <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
        {!user ? (
          <>
            <li><Link to="/musicians" onClick={closeMenu}>Find Musicians</Link></li>
            <li><Link to="/login" onClick={closeMenu}>Login</Link></li>
            <li><Link to="/register" className="btn-register" onClick={closeMenu}>Sign Up</Link></li>
          </>
        ) : user.role === 'musician' ? (
          <>
            <li><Link to="/musician/dashboard" onClick={closeMenu}>Dashboard</Link></li>
            <li><Link to="/musician/profile" onClick={closeMenu}>Edit Profile</Link></li>
            <li>
              <button className="btn-logout" onClick={handleLogout}>Logout ({user.full_name})</button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/musicians" onClick={closeMenu}>Find Musicians</Link></li>
            <li><Link to="/dashboard" onClick={closeMenu}>My Bookings</Link></li>
            <li>
              <button className="btn-logout" onClick={handleLogout}>Logout ({user.full_name})</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}