import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { adminCourseService } from '../services/adminCourseService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import Modal from '../components/common/Modal';
import './AdminCoursesManagement.css';

export default function AdminCoursesManagement() {
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [pendingDeleteCourse, setPendingDeleteCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (location.state?.refreshAt) {
      fetchCourses();
      showToast('Course list updated', 'success');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  const handleDelete = (course) => {
    setPendingDeleteCourse(course);
  };

  const confirmDeleteCourse = async () => {
    if (!pendingDeleteCourse?._id) return;
    try {
      await adminCourseService.deleteCourse(pendingDeleteCourse._id);
      setCourses(courses.filter(c => c._id !== pendingDeleteCourse._id));
      showToast('Course deleted successfully', 'success');
    } catch (error) {
      showToast('Error deleting course', 'error');
      console.error(error);
    } finally {
      setPendingDeleteCourse(null);
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
        <Link to="/admin/courses/add" className="btn-primary">
          Create New Course
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
          <option value="all">Status</option>
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
                <th>S.No</th>
                <th>Course Name</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course, index) => (
                <tr key={course._id}>
                  <td>{index + 1}</td>
                  <td className="course-name">
                    <strong>{course.title}</strong>
                  </td>
                  <td>
                    <span className={`status-badge ${course.status}`}>
                      {course.status}
                    </span>
                  </td>
                  <td>
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>
                  <td className="actions">
                    <Link to={`/admin/courses/${course._id}`} className="btn-icon-action" aria-label="Edit course" title="Edit">
                      ✏️
                    </Link>
                    <button
                      onClick={() => handleDelete(course)}
                      className="btn-icon-action delete"
                      aria-label="Delete course"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>No courses found</p>
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

      {pendingDeleteCourse && (
        <Modal
          title="Delete Course"
          message={`Are you sure you want to delete "${pendingDeleteCourse.title}"?`}
          onConfirm={confirmDeleteCourse}
          onCancel={() => setPendingDeleteCourse(null)}
          isDangerous
        />
      )}
    </div>
  );
}
