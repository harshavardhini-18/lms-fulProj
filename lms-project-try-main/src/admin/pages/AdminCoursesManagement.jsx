import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { adminCourseService } from '../services/adminCourseService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import Modal from '../components/common/Modal';
import './AdminCoursesManagement.css';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const LEVEL_COLORS = {
  beginner: { bg: '#dcfce7', color: '#15803d' },
  intermediate: { bg: '#fef3c7', color: '#b45309' },
  advanced: { bg: '#fee2e2', color: '#b91c1c' },
  expert: { bg: '#ede9fe', color: '#6d28d9' },
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80';

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
    let filtered = courses;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((c) => c.title?.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }
    setFilteredCourses(filtered);
  }, [courses, search, statusFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [body, countsPayload] = await Promise.all([
        adminCourseService.getAllCourses(),
        adminCourseService.getCourseCounts().catch(() => ({ data: {} })),
      ]);
      const list = Array.isArray(body) ? body : body?.data ?? [];
      const countMap = countsPayload?.data || {};
      setCourses(
        list.map((c) => {
          const id = String(c._id ?? c.id ?? '');
          const fromCounts = countMap[id];
          const modList = Number(c?.moduleCount ?? c?.module_count);
          const lesList = Number(c?.lessonCount ?? c?.lesson_count);
          return {
            ...c,
            moduleCount:
              fromCounts?.moduleCount ??
              (Number.isFinite(modList) ? modList : 0),
            lessonCount:
              fromCounts?.lessonCount ??
              (Number.isFinite(lesList) ? lesList : 0),
          };
        })
      );
    } catch {
      showToast('Error loading courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (course) => setPendingDeleteCourse(course);

  const confirmDelete = async () => {
    if (!pendingDeleteCourse?._id) return;
    try {
      await adminCourseService.deleteCourse(pendingDeleteCourse._id);
      setCourses((prev) => prev.filter((c) => c._id !== pendingDeleteCourse._id));
      showToast('Course deleted', 'success');
    } catch {
      showToast('Error deleting course', 'error');
    } finally {
      setPendingDeleteCourse(null);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const draftCount = courses.filter((c) => c.status === 'draft').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="acm-page">
      {/* Page header */}
      <div className="acm-header">
        <div className="acm-header-left">
          <h1 className="acm-title">Course Library</h1>
          <p className="acm-subtitle">Manage and publish courses for your students</p>
        </div>
        <Link to="/admin/courses/new" className="acm-create-btn">
          New Course
        </Link>
      </div>

      {/* Stats row */}
      <div className="acm-stats">
        <div className="acm-stat">
          <span className="acm-stat-value">{courses.length}</span>
          <span className="acm-stat-label">Total</span>
        </div>
        <div className="acm-stat">
          <span className="acm-stat-value" style={{ color: '#10b981' }}>{publishedCount}</span>
          <span className="acm-stat-label">Published</span>
        </div>
        <div className="acm-stat">
          <span className="acm-stat-value" style={{ color: '#f59e0b' }}>{draftCount}</span>
          <span className="acm-stat-label">Draft</span>
        </div>
      </div>

      {/* Filters */}
      <div className="acm-filters">
        <div className="acm-search-wrap">
          <svg className="acm-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="acm-search-input"
          />
        </div>

        <div className="acm-filter-pills">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`acm-pill${statusFilter === f.value ? ' active' : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="acm-count">
        Showing <strong>{filteredCourses.length}</strong> of {courses.length} course{courses.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      {filteredCourses.length > 0 ? (
        <div className="acm-grid">
          {filteredCourses.map((course) => {
            const levelMeta = LEVEL_COLORS[course.level] || LEVEL_COLORS.beginner;
            const moduleCount = course.moduleCount ?? (course.modules || []).length;
            const lessonCount = course.lessonCount ?? (course.modules || []).reduce(
              (sum, m) => sum + (m.lessons?.length || 0), 0
            );

            return (
              <div key={course._id} className="acm-card">
                <Link to={`/admin/courses/${course._id}/preview`} className="acm-card-main">
                  {/* Thumbnail */}
                  <div className="acm-card-thumb">
                    <img
                      src={course.thumbnailUrl || FALLBACK_IMG}
                      alt={course.title}
                      onError={(e) => { e.target.src = FALLBACK_IMG; }}
                    />
                    <span className={`acm-status-badge ${course.status}`}>
                      {course.status}
                    </span>
                    {course.level && (
                      <span
                        className="acm-level-badge"
                        style={{ background: levelMeta.bg, color: levelMeta.color }}
                      >
                        {course.level}
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="acm-card-body">
                    <h3 className="acm-card-title">{course.title}</h3>
                    {course.description && (
                      <p className="acm-card-desc">{course.description}</p>
                    )}

                    {course.tags && course.tags.length > 0 && (
                      <div className="acm-card-tags">
                        {course.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="acm-tag">{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="acm-card-meta">
                      <span className="acm-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                        {moduleCount} module{moduleCount !== 1 ? 's' : ''}
                      </span>
                      <span className="acm-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        {lessonCount} topic{lessonCount !== 1 ? 's' : ''}
                      </span>
                      {course.instructor && (
                        <span className="acm-meta-item">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          {course.instructor}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Actions */}
                <div className="acm-card-actions">
                  <Link to={`/admin/courses/${course._id}`} className="acm-action-edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="acm-action-delete"
                    onClick={() => handleDelete(course)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="acm-empty">
          {search || statusFilter !== 'all' ? (
            <>
              <div className="acm-empty-icon">🔍</div>
              <h3>No courses found</h3>
              <p>Try adjusting your search or filters.</p>
            </>
          ) : (
            <>
              <div className="acm-empty-icon">📚</div>
              <h3>No courses yet</h3>
              <p>Create your first course to get started.</p>
              <Link to="/admin/courses/new" className="acm-create-btn">
                Create Course
              </Link>
            </>
          )}
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          position="top-center"
          onClose={() => setToast(null)}
        />
      )}

      {pendingDeleteCourse && (
        <Modal
          title="Delete Course"
          message={`Are you sure you want to delete "${pendingDeleteCourse.title}"? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteCourse(null)}
          isDangerous
        />
      )}
    </div>
  );
}
