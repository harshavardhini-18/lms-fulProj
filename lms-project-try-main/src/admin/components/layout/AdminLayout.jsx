import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

export default function AdminLayout() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-page">Loading...</div>;
  }

  // RoleOnlyRoute already validates auth, but double-check for safety
  if (!user || (role !== 'admin' && role !== 'staff')) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-main">
        <AdminSidebar />
        <main className="admin-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
