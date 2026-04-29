import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import Navbar from './components/Navbar'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import AdminUsers from './pages/AdminUsers'
import AdminDashboard from './pages/AdminDashboard'
import AdminCoursesManagement from './admin/pages/AdminCoursesManagement'
import AdminAddCourse from './admin/pages/AdminAddCourse'
import AdminCourseEditorNew from './admin/pages/AdminCourseEditorNew'
import Reports from './pages/Reports'
import StaffDashboard from './pages/StaffDashboard'
import StudentHome from './pages/StudentHome'
import StudentOnboarding from './pages/StudentOnboarding'
import StudentProfile from './pages/StudentProfile'
import { AuthProvider } from './auth/AuthContext'
import { auth } from './firebase'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function PlaceholderPage({ title, subtitle }) {
  return (
    <section className="placeholderPage">
      <p className="eyebrow">LMS Platform</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </section>
  )
}

function ProtectedRoute({ isLoading, user, children }) {
  const location = useLocation()

  if (isLoading) {
    return <div className="routeLoading">Checking login…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

function PublicOnlyRoute({ isLoading, user, children }) {
  if (isLoading) {
    return <div className="routeLoading">Checking login…</div>
  }

  if (user) {
    const role = String(localStorage.getItem('lmsUserRole') || 'student').toLowerCase()
    const destination =
      role === 'admin'
        ? '/admin/dashboard'
        : role === 'staff'
          ? '/staff/dashboard'
          : '/student/home'
    return <Navigate to={destination} replace />
  }

  return children
}

function RoleOnlyRoute({ isLoading, user, role, allowedRoles, children }) {
  if (isLoading) {
    return <div className="routeLoading">Checking login…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const normalizedRole = String(role || '').toLowerCase()
  if (!allowedRoles.includes(normalizedRole)) {
    const destination =
      normalizedRole === 'admin'
        ? '/admin/dashboard'
        : normalizedRole === 'staff'
          ? '/staff/dashboard'
          : '/student/home'
    return <Navigate to={destination} replace />
  }

  return children
}

function LegacyCourseDetailRedirect() {
  const { id } = useParams()
  return <Navigate to={`/student/courses/${id}`} replace />
}

function App() {
  const location = useLocation()
  const [authUser, setAuthUser] = useState(null)
  const [authRole, setAuthRole] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthUser(null)
        setAuthRole(null)
        localStorage.removeItem('lmsUserId')
        localStorage.removeItem('lmsUserRole')
        setIsAuthLoading(false)
        return
      }

      setAuthUser(user)

      try {
        const idToken = await user.getIdToken()
        const response = await fetch(`${API_BASE_URL}/api/auth/firebase/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        })

        const payload = await response.json().catch(() => ({}))
        const backendUser = payload?.data?.user
        const backendUserId = backendUser?.id ?? backendUser?._id

        if (!response.ok || !backendUserId) {
          throw new Error(payload?.message || 'Failed to sync user role')
        }

        const normalizedRole = String(backendUser.role || '').toLowerCase()
        localStorage.setItem('lmsUserId', String(backendUserId))
        localStorage.setItem('lmsUserRole', normalizedRole)
        setAuthRole(normalizedRole || null)
      } catch {
        const storedRole = localStorage.getItem('lmsUserRole')
        setAuthRole(String(storedRole || '').toLowerCase() || null)
      } finally {
        setIsAuthLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const showNavbar = location.pathname !== '/login' && location.pathname !== '/reset'
  const normalizedRole = String(authRole || '').toLowerCase() || null

  return (
    <AuthProvider value={{ user: authUser, role: normalizedRole, isLoading: isAuthLoading }}>
      <div className="appShell">
        {showNavbar ? <Navbar role={normalizedRole || 'student'} /> : null}

        <main>
          <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute isLoading={isAuthLoading} user={authUser}>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/reset"
            element={<ResetPassword />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute isLoading={isAuthLoading} user={authUser}>
                <Navigate
                  to={
                    normalizedRole === 'admin'
                      ? '/admin/dashboard'
                      : normalizedRole === 'staff'
                        ? '/staff/dashboard'
                        : '/student/home'
                  }
                  replace
                />
              </ProtectedRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/student/onboarding"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['student']}>
                <StudentOnboarding />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/student/home"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['student']}>
                <StudentHome />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/student/courses"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['student']}>
                <Courses />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/student/courses/:id"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['student']}>
                <CourseDetail />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/student/career"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['student']}>
                <PlaceholderPage
                  title="Career Tracks"
                  subtitle="Career roadmap modules are coming soon with mentor-led paths and interview prep."
                />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['student']}>
                <StudentProfile />
              </RoleOnlyRoute>
            }
          />

          {/* Backwards-compatible student paths */}
          <Route path="/courses" element={<Navigate to="/student/courses" replace />} />
          <Route path="/courses/:id" element={<LegacyCourseDetailRedirect />} />
          <Route path="/career" element={<Navigate to="/student/career" replace />} />
          <Route path="/profile" element={<Navigate to="/student/profile" replace />} />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['admin']}>
                <AdminUsers />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['admin']}>
                <AdminCoursesManagement />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/admin/courses/add"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['admin']}>
                <AdminAddCourse />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['admin']}>
                <AdminCourseEditorNew />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['admin']}>
                <Reports />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['admin']}>
                <PlaceholderPage title="Admin Profile" subtitle="Admin profile settings (coming soon)." />
              </RoleOnlyRoute>
            }
          />

          {/* Staff routes */}
          <Route
            path="/staff/dashboard"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['staff']}>
                <StaffDashboard />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/staff/courses"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['staff']}>
                <AdminCoursesManagement />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/staff/courses/:courseId"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['staff']}>
                <AdminCourseEditorNew />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/staff/reports"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['staff']}>
                <Reports />
              </RoleOnlyRoute>
            }
          />
          <Route
            path="/staff/profile"
            element={
              <RoleOnlyRoute isLoading={isAuthLoading} user={authUser} role={normalizedRole} allowedRoles={['staff']}>
                <PlaceholderPage title="Staff Profile" subtitle="Staff profile settings (coming soon)." />
              </RoleOnlyRoute>
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to={
                  authUser
                    ? normalizedRole === 'admin'
                      ? '/admin/dashboard'
                      : normalizedRole === 'staff'
                        ? '/staff/dashboard'
                        : '/student/home'
                    : '/login'
                }
                replace
              />
            }
          />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

export default App
