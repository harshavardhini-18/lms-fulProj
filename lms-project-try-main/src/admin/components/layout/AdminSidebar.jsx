import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

export default function AdminSidebar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="admin-sidebar">
      <nav className="sidebar-nav">
        {/* Courses Section */}
        <div className="nav-section">
          <h3 className="section-title">📚 Courses Management</h3>
          <Link 
            to="/admin"
            className={`nav-item ${isActive('/admin') && location.pathname === '/admin' ? 'active' : ''}`}
          >
            👁️ Dashboard
          </Link>
          <Link 
            to="/admin/courses"
            className={`nav-item ${isActive('/admin/courses') ? 'active' : ''}`}
          >
            📋 All Courses
          </Link>
          <Link 
            to="/admin/courses/add"
            className="nav-item"
          >
            ➕ Create Course
          </Link>
        </div>

        {/* Settings Section */}
        <div className="nav-section">
          <h3 className="section-title">⚙️ Settings</h3>
          <Link 
            to="/admin/settings"
            className="nav-item"
          >
            🔐 Account
          </Link>
          <Link 
            to="/admin/profile"
            className="nav-item"
          >
            👤 Profile
          </Link>
        </div>
      </nav>
    </aside>
  );
}
