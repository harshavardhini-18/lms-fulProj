import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { auth } from '../../../firebase';
import { signOut } from 'firebase/auth';
import './AdminNavbar.css';

export default function AdminNavbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('lmsUserId');
      localStorage.removeItem('lmsUserRole');
      localStorage.removeItem('accessToken');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  return (
    <nav className="admin-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/admin" className="navbar-logo">
          <span className="logo-icon">🔵</span>
          <span className="logo-text">LMS Admin</span>
        </Link>

        {/* Nav Links */}
        <div className="navbar-nav">
          <Link to="/admin" className="nav-link">
            Dashboard
          </Link>
          <Link to="/admin/courses" className="nav-link">
            Courses
          </Link>
          <a href="/" className="nav-link" target="_blank" rel="noopener noreferrer">
            View as Student
          </a>
        </div>

        {/* User Dropdown */}
        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user?.displayName || user?.email?.split('@')[0] || 'Admin'}</span>
            <span className="user-role">{localStorage.getItem('lmsUserRole') || 'admin'}</span>
          </div>

          <button 
            className="user-button"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            ▼
          </button>

          {showDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-item">
                <strong>{user?.email}</strong>
              </div>
              <hr />
              <button className="dropdown-link" onClick={() => navigate('/admin/settings')}>
                ⚙️ Settings
              </button>
              <button className="dropdown-link" onClick={() => navigate('/admin/profile')}>
                👤 Profile
              </button>
              <hr />
              <button className="dropdown-link logout" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
