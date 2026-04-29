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
        <Link to="/admin/courses/add" className="action-button">
          ➕ Create New Course
        </Link>
        <Link to="/admin/courses" className="action-button secondary">
          📋 View All Courses
        </Link>
      </section>
    </div>
  );
}
