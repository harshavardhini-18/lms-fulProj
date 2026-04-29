# 🚀 ADMIN FRONTEND - COMPLETE BUILD GUIDE

## 📋 BUILD PLAN

```
WEEK 1: Core Infrastructure
├─ Day 1-2: Setup + Navbar + Sidebar
├─ Day 3: AdminDashboard page
├─ Day 4: AdminCoursesManagement page
└─ Day 5: Integration & Testing

WEEK 2: Editors
├─ Day 6-7: Course Editor components
├─ Day 8-9: Lesson Editor + Quiz Builder
└─ Day 10: Integration testing

WEEK 3: Polish
├─ Day 11-12: Error handling & validation
├─ Day 13-14: Testing all flows
└─ Day 15: Final deployment
```

---

## 📁 PROJECT STRUCTURE

Create this folder structure in `lms-project-try-main/src/`:

```
src/
├── admin/
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminCoursesManagement.jsx
│   │   ├── AdminCourseEditor.jsx
│   │   ├── AdminModuleEditor.jsx
│   │   ├── AdminLessonEditor.jsx
│   │   └── AdminQuizBuilder.jsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminNavbar.jsx
│   │   │   ├── AdminSidebar.jsx
│   │   │   └── AdminLayout.jsx
│   │   │
│   │   ├── common/
│   │   │   ├── FormInput.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── CourseCard.jsx
│   │   │   └── ModuleList.jsx
│   │   │
│   │   └── forms/
│   │       ├── CourseForm.jsx
│   │       ├── ModuleForm.jsx
│   │       ├── LessonForm.jsx
│   │       └── QuizForm.jsx
│   │
│   ├── services/
│   │   ├── adminCourseService.js
│   │   ├── adminModuleService.js
│   │   ├── adminLessonService.js
│   │   └── adminQuizService.js
│   │
│   ├── hooks/
│   │   ├── useAdminAuth.js
│   │   ├── useCourseEditor.js
│   │   └── useFetch.js
│   │
│   ├── context/
│   │   ├── AdminAuthContext.jsx
│   │   └── AdminCoursesContext.jsx
│   │
│   └── utils/
│       ├── validation.js
│       └── formatters.js
│
└── admin.css  ← Admin-specific styles
```

---

## 🏗️ STEP 1: Setup Admin Routes

### Update `App.jsx`:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Student Pages
import StudentHome from './pages/StudentHome';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminCoursesManagement from './admin/pages/AdminCoursesManagement';
import AdminCourseEditor from './admin/pages/AdminCourseEditor';
import AdminModuleEditor from './admin/pages/AdminModuleEditor';
import AdminLessonEditor from './admin/pages/AdminLessonEditor';
import AdminQuizBuilder from './admin/pages/AdminQuizBuilder';

// Admin Layout
import AdminLayout from './admin/components/layout/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Student Routes */}
          <Route path="/" element={<StudentHome />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCoursesManagement />} />
            <Route path="courses/:courseId" element={<AdminCourseEditor />} />
            <Route path="courses/:courseId/modules/:moduleId" element={<AdminModuleEditor />} />
            <Route path="courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<AdminLessonEditor />} />
            <Route path="quizzes/:quizId" element={<AdminQuizBuilder />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🎨 STEP 2: Admin Navbar Component

### File: `admin/components/layout/AdminNavbar.jsx`

```jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import './AdminNavbar.css';

export default function AdminNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
            <span className="user-name">{user?.fullName || 'Admin'}</span>
            <span className="user-role">{user?.role}</span>
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
```

### File: `admin/components/layout/AdminNavbar.css`

```css
.admin-navbar {
  background-color: #7c3aed;
  color: white;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 100%;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.logo-icon {
  font-size: 1.8rem;
}

.logo-text {
  font-size: 1.2rem;
}

.navbar-nav {
  display: flex;
  gap: 2rem;
  flex: 1;
  margin-left: 3rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.user-info {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.user-role {
  font-size: 0.8rem;
  opacity: 0.9;
}

.user-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.user-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  color: #1f2937;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  padding: 0.5rem 0;
  min-width: 200px;
  margin-top: 0.5rem;
  z-index: 1000;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
}

.dropdown-link {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: #1f2937;
  transition: background-color 0.2s;
}

.dropdown-link:hover {
  background-color: #f3f4f6;
}

.dropdown-link.logout {
  color: #ef4444;
  font-weight: 600;
}

.dropdown-link.logout:hover {
  background-color: #fee2e2;
}

.user-dropdown hr {
  margin: 0.25rem 0;
  border: none;
  border-top: 1px solid #e5e7eb;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0.75rem 1rem;
  }

  .navbar-nav {
    display: none;
  }

  .user-info {
    display: none;
  }
}
```

---

## 🎨 STEP 3: Admin Sidebar Component

### File: `admin/components/layout/AdminSidebar.jsx`

```jsx
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
            to="/admin/courses"
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
```

### File: `admin/components/layout/AdminSidebar.css`

```css
.admin-sidebar {
  width: 250px;
  background-color: #f1f5f9;
  border-right: 1px solid #e5e7eb;
  padding: 2rem 0;
  min-height: calc(100vh - 60px);
  position: sticky;
  top: 60px;
  overflow-y: auto;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.nav-section {
  padding: 0 1rem;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 1rem 0;
}

.nav-item {
  display: block;
  padding: 0.75rem 1rem;
  color: #374151;
  text-decoration: none;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.nav-item:hover {
  background-color: #e5e7eb;
  color: #111827;
  transform: translateX(2px);
}

.nav-item.active {
  background-color: #7c3aed;
  color: white;
  font-weight: 600;
}

.nav-item.active:hover {
  background-color: #6d28d9;
}

/* Scrollbar styling */
.admin-sidebar::-webkit-scrollbar {
  width: 6px;
}

.admin-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.admin-sidebar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.admin-sidebar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-sidebar {
    width: 100%;
    display: none;
    position: fixed;
    left: 0;
    top: 60px;
    height: auto;
    min-height: auto;
    z-index: 99;
    padding: 1rem 0;
  }

  .admin-sidebar.open {
    display: block;
  }
}
```

---

## 🎨 STEP 4: Admin Layout (Wrapper)

### File: `admin/components/layout/AdminLayout.jsx`

```jsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-page">Loading...</div>;
  }

  // Redirect to login if not authenticated or not admin
  if (!user || user.role !== 'admin' && user.role !== 'staff') {
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
```

### File: `admin/components/layout/AdminLayout.css`

```css
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f9fafb;
}

.admin-main {
  display: flex;
  flex: 1;
}

.admin-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.loading-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #6b7280;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-main {
    flex-direction: column;
  }

  .admin-content {
    padding: 1rem;
  }
}
```

---

## 📊 STEP 5: Admin Dashboard Page

### File: `admin/pages/AdminDashboard.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminCourseService } from '../services/adminCourseService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all courses to get stats
      const coursesResponse = await adminCourseService.getAllCourses();
      const courses = coursesResponse.data || [];

      // Calculate stats
      const stats = {
        totalCourses: courses.length,
        publishedCourses: courses.filter(c => c.status === 'published').length,
        draftCourses: courses.filter(c => c.status === 'draft').length,
        totalStudents: courses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0),
      };

      setStats(stats);

      // Get recent courses (last 3)
      const recent = courses.slice(-3).reverse();
      setRecentCourses(recent);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p className="welcome-text">Welcome back, Admin! 👋</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Quick Stats */}
      <section className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-label">Total Courses</div>
            <div className="stat-value">{stats?.totalCourses || 0}</div>
            <div className="stat-detail">
              Published: {stats?.publishedCourses} | Draft: {stats?.draftCourses}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{stats?.totalStudents || 0}</div>
            <div className="stat-detail">Across all courses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Completion Rate</div>
            <div className="stat-value">--</div>
            <div className="stat-detail">Coming in v2</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Analytics</div>
            <div className="stat-value">--</div>
            <div className="stat-detail">Coming in v2</div>
          </div>
        </div>
      </section>

      {/* Recent Courses */}
      <section className="recent-courses">
        <div className="section-header">
          <h2>Recent Courses</h2>
          <Link to="/admin/courses" className="view-all-link">
            View All →
          </Link>
        </div>

        {recentCourses.length > 0 ? (
          <div className="courses-table">
            <table>
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Status</th>
                  <th>Modules</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentCourses.map(course => (
                  <tr key={course._id}>
                    <td className="course-name">
                      <strong>{course.title}</strong>
                      <br />
                      <small>by {course.createdBy?.fullName || 'Admin'}</small>
                    </td>
                    <td>
                      <span className={`status-badge ${course.status}`}>
                        {course.status}
                      </span>
                    </td>
                    <td>{course.modules?.length || 0}</td>
                    <td>{course.enrolledStudents?.length || 0}</td>
                    <td className="actions">
                      <Link to={`/admin/courses/${course._id}`} className="btn-small">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No courses yet. Create one to get started!</p>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <Link to="/admin/courses" className="action-button">
          ➕ Create New Course
        </Link>
        <Link to="/admin/courses" className="action-button secondary">
          📋 View All Courses
        </Link>
      </section>
    </div>
  );
}
```

### File: `admin/pages/AdminDashboard.css`

```css
.admin-dashboard {
  padding: 2rem 0;
}

.dashboard-header {
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  font-size: 2rem;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.welcome-text {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

.error-message {
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

/* Quick Stats */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  display: flex;
  gap: 1.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2.5rem;
  min-width: 60px;
  text-align: center;
}

.stat-content {
  flex: 1;
}

.stat-label {
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0.5rem 0;
}

.stat-detail {
  color: #9ca3af;
  font-size: 0.85rem;
}

/* Recent Courses */
.recent-courses {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 2rem;
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #111827;
}

.view-all-link {
  color: #7c3aed;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.view-all-link:hover {
  color: #6d28d9;
}

/* Table */
.courses-table {
  overflow-x: auto;
}

.courses-table table {
  width: 100%;
  border-collapse: collapse;
}

.courses-table th {
  background-color: #f3f4f6;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.85rem;
  border-bottom: 2px solid #e5e7eb;
}

.courses-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.courses-table tr:hover {
  background-color: #f9fafb;
}

.course-name {
  font-weight: 500;
}

.course-name strong {
  color: #111827;
}

.course-name small {
  color: #9ca3af;
  display: block;
  margin-top: 0.25rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.published {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge.draft {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.archived {
  background-color: #f3f4f6;
  color: #6b7280;
}

.actions {
  text-align: right;
}

.btn-small {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #7c3aed;
  color: white;
  text-decoration: none;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-small:hover {
  background-color: #6d28d9;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  gap: 1rem;
}

.action-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #7c3aed;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: #6d28d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);
}

.action-button.secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.action-button.secondary:hover {
  background-color: #d1d5db;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem 0;
  }

  .dashboard-header h1 {
    font-size: 1.5rem;
  }

  .quick-stats {
    grid-template-columns: 1fr;
  }

  .recent-courses {
    padding: 1rem;
  }

  .quick-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
    text-align: center;
  }
}
```

---

## 📋 STEP 6: Admin Courses Management Page

### File: `admin/pages/AdminCoursesManagement.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminCourseService } from '../services/adminCourseService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import './AdminCoursesManagement.css';

export default function AdminCoursesManagement() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, search, statusFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await adminCourseService.getAllCourses();
      setCourses(response.data || []);
    } catch (error) {
      showToast('Error loading courses', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    setFilteredCourses(filtered);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      await adminCourseService.deleteCourse(courseId);
      setCourses(courses.filter(c => c._id !== courseId));
      showToast('Course deleted successfully', 'success');
    } catch (error) {
      showToast('Error deleting course', 'error');
      console.error(error);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="courses-management">
      <div className="page-header">
        <h1>Courses Management</h1>
        <Link to="/admin/courses/new" className="btn-primary">
          ➕ Create New Course
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Courses Table */}
      {filteredCourses.length > 0 ? (
        <div className="courses-table">
          <table>
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Status</th>
                <th>Modules</th>
                <th>Students</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map(course => (
                <tr key={course._id}>
                  <td className="course-name">
                    <strong>{course.title}</strong>
                    <p>{course.description?.substring(0, 50)}...</p>
                  </td>
                  <td>
                    <span className={`status-badge ${course.status}`}>
                      {course.status}
                    </span>
                  </td>
                  <td>{course.modules?.length || 0}</td>
                  <td>{course.enrolledStudents?.length || 0}</td>
                  <td>
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>
                  <td className="actions">
                    <Link to={`/admin/courses/${course._id}`} className="btn-small">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(course._id)}
                      className="btn-small delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>🔍 No courses found</p>
          <p className="subtitle">Create one to get started!</p>
          <Link to="/admin/courses/new" className="btn-primary">
            ➕ Create First Course
          </Link>
        </div>
      )}

      {/* Results count */}
      <div className="results-info">
        Showing {filteredCourses.length} of {courses.length} courses
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
```

### File: `admin/pages/AdminCoursesManagement.css`

```css
.courses-management {
  padding: 2rem 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #111827;
  margin: 0;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #7c3aed;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #6d28d9;
}

/* Filters */
.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-input,
.filter-select {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #374151;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

/* Table */
.courses-table {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.courses-table table {
  width: 100%;
  border-collapse: collapse;
}

.courses-table th {
  background-color: #f3f4f6;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.85rem;
  border-bottom: 2px solid #e5e7eb;
}

.courses-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.courses-table tr:hover {
  background-color: #f9fafb;
}

.course-name strong {
  color: #111827;
  display: block;
  margin-bottom: 0.25rem;
}

.course-name p {
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 0.25rem 0 0 0;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.published {
  background-color: #dcfce7;
  color: #166534;
}

.status-badge.draft {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.archived {
  background-color: #f3f4f6;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #7c3aed;
  color: white;
  text-decoration: none;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-small:hover {
  background-color: #6d28d9;
}

.btn-small.delete {
  background-color: #ef4444;
}

.btn-small.delete:hover {
  background-color: #dc2626;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border: 1px dashed #e5e7eb;
  border-radius: 0.5rem;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
  font-size: 1.1rem;
}

.empty-state .subtitle {
  color: #9ca3af;
  margin: 0.5rem 0 2rem 0;
  font-size: 0.95rem;
}

/* Results Info */
.results-info {
  margin-top: 1rem;
  color: #6b7280;
  font-size: 0.9rem;
  text-align: right;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .filters-section {
    flex-direction: column;
  }

  .courses-table {
    overflow-x: auto;
  }

  .actions {
    flex-direction: column;
  }

  .btn-small {
    width: 100%;
    text-align: center;
  }
}
```

---

## 🛠️ STEP 7: Admin Course Service

### File: `admin/services/adminCourseService.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with auth token
const getAxiosInstance = () => {
  const token = localStorage.getItem('accessToken');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const adminCourseService = {
  // Get all courses
  getAllCourses: async () => {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.get('/courses');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single course with all details
  getCourse: async (courseId) => {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.get(`/courses/${courseId}/full`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new course
  createCourse: async (courseData) => {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.post('/courses', courseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update course
  updateCourse: async (courseId, courseData) => {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.put(`/courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete course
  deleteCourse: async (courseId) => {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.delete(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
```

---

## 🧩 STEP 8: Reusable Components

### File: `admin/components/common/LoadingSpinner.jsx`

```jsx
import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner() {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );
}
```

### File: `admin/components/common/LoadingSpinner.css`

```css
.loading-spinner-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.loading-spinner {
  border: 4px solid #f3f4f6;
  border-top: 4px solid #7c3aed;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### File: `admin/components/common/Toast.jsx`

```jsx
import React, { useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timeout = setTimeout(onClose, 3000);
    return () => clearTimeout(timeout);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        {type === 'success' && <span className="toast-icon">✅</span>}
        {type === 'error' && <span className="toast-icon">❌</span>}
        {type === 'info' && <span className="toast-icon">ℹ️</span>}
        <span>{message}</span>
      </div>
    </div>
  );
}
```

### File: `admin/components/common/Toast.css`

```css
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.toast-success {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.toast-error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.toast-info {
  background-color: #dbeafe;
  color: #0c4a6e;
  border: 1px solid #bfdbfe;
}

.toast-icon {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .toast {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
}
```

---

## ✅ NEXT STEPS

### Day 1 Summary (Files to Create):
✅ `admin/components/layout/AdminNavbar.jsx` + CSS
✅ `admin/components/layout/AdminSidebar.jsx` + CSS
✅ `admin/components/layout/AdminLayout.jsx` + CSS
✅ `admin/pages/AdminDashboard.jsx` + CSS
✅ `admin/pages/AdminCoursesManagement.jsx` + CSS
✅ `admin/services/adminCourseService.js`
✅ `admin/components/common/LoadingSpinner.jsx` + CSS
✅ `admin/components/common/Toast.jsx` + CSS
✅ Update `App.jsx` with routes

### Testing Checklist:
- [ ] Navigate to `/admin` - should show Dashboard
- [ ] Dashboard loads stats correctly
- [ ] Click "View All" goes to `/admin/courses`
- [ ] Search filters courses
- [ ] Status filter works
- [ ] Delete button works with confirmation
- [ ] Create button navigates properly
- [ ] Navbar user dropdown works
- [ ] Sidebar navigation works
- [ ] Toast notifications appear

---

## 📞 YOUR NEXT STEP

Have you completed these components? 

**If YES:**
- I'll create the Course Editor page next
- Or create Module/Lesson editors
- Or create admin API endpoints for backend

**If NO:**
- Let me know which component needs clarification
- I'll provide more detailed explanations
- Or create a simpler version

Which would you like? 👇
