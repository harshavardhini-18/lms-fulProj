import { useEffect, useState } from 'react'
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useLocation,
  useParams,
} from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import Navbar from './components/Navbar'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import AdminUsers from './pages/AdminUsers'
import AdminDashboard from './pages/AdminDashboard'
import StaffDashboard from './pages/StaffDashboard'
import AdminCoursesManagement from './admin/pages/AdminCoursesManagement'
import AdminAddCourse from './admin/pages/AdminAddCourse'
import AdminCourseEditorNew from './admin/pages/AdminCourseEditorNew'
import AdminCoursePreview from './admin/pages/AdminCoursePreview'
import AdminQuizManagement from './admin/pages/AdminQuizManagement'
import AdminQuizEditor from './admin/pages/AdminQuizEditor'
import StudentHome from './pages/StudentHome'
import StudentOnboarding from './pages/StudentOnboarding'
import StudentProfile from './pages/StudentProfile'
import StudentQuizList from './pages/studentQuiz/StudentQuizList'
import StudentQuizOverview from './pages/studentQuiz/StudentQuizOverview'
import StudentQuizAttempt from './pages/studentQuiz/StudentQuizAttempt'
import StudentQuizResults from './pages/studentQuiz/StudentQuizResults'
import { AuthProvider, useAuth } from './auth/AuthContext'
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

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="routeLoading">Checking login…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

function PublicOnlyRoute({ children }) {
  const { user, isLoading } = useAuth()
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

function RoleOnlyRoute({ allowedRoles, children }) {
  const { user, role, isLoading } = useAuth()
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

function RootIndexRedirect() {
  const { role } = useAuth()
  const normalizedRole = String(role || '').toLowerCase()
  return (
    <ProtectedRoute>
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
  )
}

function CatchAllRedirect() {
  const { user, role } = useAuth()
  const normalizedRole = String(role || '').toLowerCase()
  return (
    <Navigate
      to={
        user
          ? normalizedRole === 'admin'
            ? '/admin/dashboard'
            : normalizedRole === 'staff'
              ? '/staff/dashboard'
              : '/student/home'
          : '/login'
      }
      replace
    />
  )
}

function RootLayout() {
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

  const isStudentQuizAttempt =
    /^\/student\/quizzes\/[^/]+\/attempt\/[^/]+$/.test(location.pathname)

  const showNavbar =
    location.pathname !== '/login' &&
    location.pathname !== '/reset' &&
    !isStudentQuizAttempt
  const normalizedRole = String(authRole || '').toLowerCase() || null

  return (
    <AuthProvider value={{ user: authUser, role: normalizedRole, isLoading: isAuthLoading }}>
      <div className={showNavbar ? 'appShell' : 'appShell appShell--noHeader'}>
        {showNavbar ? <Navbar role={normalizedRole || 'student'} /> : null}

        <main>
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  )
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <PublicOnlyRoute><Login /></PublicOnlyRoute> },
      { path: '/reset', element: <ResetPassword /> },
      { path: '/', element: <RootIndexRedirect /> },
      {
        path: '/student/onboarding',
        element: (
          <RoleOnlyRoute allowedRoles={['student']}>
            <StudentOnboarding />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/student/home',
        element: (
          <RoleOnlyRoute allowedRoles={['student']}>
            <StudentHome />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/student/courses',
        element: (
          <RoleOnlyRoute allowedRoles={['student']}>
            <Courses />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/student/courses/:id',
        element: (
          <RoleOnlyRoute allowedRoles={['student']}>
            <CourseDetail />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/student/quizzes',
        element: (
          <RoleOnlyRoute allowedRoles={['student']}>
            <StudentQuizList />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/student/quizzes/:quizId',
        element: (
          <RoleOnlyRoute allowedRoles={['student']}>
            <StudentQuizOverview />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/student/quizzes/:quizId/attempt/:attemptId',
        element: (
          <RoleOnlyRoute allowedRoles={['student']}>
            <StudentQuizAttempt />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/student/quizzes/:quizId/results/:attemptId',
        element: (
          <RoleOnlyRoute allowedRoles={['student']}>
            <StudentQuizResults />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/student/career',
        element: (
          <RoleOnlyRoute allowedRoles={['student']}>
            <PlaceholderPage
              title="Career Tracks"
              subtitle="Career roadmap modules are coming soon with mentor-led paths and interview prep."
            />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/student/profile',
        element: (
          <RoleOnlyRoute allowedRoles={['student']}>
            <StudentProfile />
          </RoleOnlyRoute>
        ),
      },
      { path: '/courses', element: <Navigate to="/student/courses" replace /> },
      { path: '/courses/:id', element: <LegacyCourseDetailRedirect /> },
      { path: '/career', element: <Navigate to="/student/career" replace /> },
      { path: '/profile', element: <Navigate to="/student/profile" replace /> },
      {
        path: '/admin/dashboard',
        element: (
          <RoleOnlyRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/admin/users',
        element: (
          <RoleOnlyRoute allowedRoles={['admin']}>
            <AdminUsers />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/admin/courses',
        element: (
          <RoleOnlyRoute allowedRoles={['admin']}>
            <AdminCoursesManagement />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/admin/courses/add',
        element: (
          <RoleOnlyRoute allowedRoles={['admin']}>
            <AdminAddCourse />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/admin/courses/:courseId/preview',
        element: (
          <RoleOnlyRoute allowedRoles={['admin']}>
            <AdminCoursePreview />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/admin/courses/:courseId',
        element: (
          <RoleOnlyRoute allowedRoles={['admin']}>
            <AdminCourseEditorNew />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/admin/quizzes',
        element: (
          <RoleOnlyRoute allowedRoles={['admin']}>
            <AdminQuizManagement />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/admin/quizzes/new',
        element: (
          <RoleOnlyRoute allowedRoles={['admin']}>
            <AdminQuizEditor />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/admin/quizzes/:id/edit',
        element: (
          <RoleOnlyRoute allowedRoles={['admin']}>
            <AdminQuizEditor />
          </RoleOnlyRoute>
        ),
      },
      { path: '/admin/reports', element: <Navigate to="/admin/quizzes" replace /> },
      {
        path: '/admin/profile',
        element: (
          <RoleOnlyRoute allowedRoles={['admin']}>
            <PlaceholderPage title="Admin Profile" subtitle="Admin profile settings (coming soon)." />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/staff/dashboard',
        element: (
          <RoleOnlyRoute allowedRoles={['staff']}>
            <StaffDashboard />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/staff/courses',
        element: (
          <RoleOnlyRoute allowedRoles={['staff']}>
            <AdminCoursesManagement />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/staff/courses/:courseId/preview',
        element: (
          <RoleOnlyRoute allowedRoles={['staff']}>
            <AdminCoursePreview />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/staff/courses/:courseId',
        element: (
          <RoleOnlyRoute allowedRoles={['staff']}>
            <AdminCourseEditorNew />
          </RoleOnlyRoute>
        ),
      },
      {
        path: '/staff/quizzes',
        element: (
          <RoleOnlyRoute allowedRoles={['staff']}>
            <AdminQuizManagement />
          </RoleOnlyRoute>
        ),
      },
      { path: '/staff/reports', element: <Navigate to="/staff/quizzes" replace /> },
      {
        path: '/staff/profile',
        element: (
          <RoleOnlyRoute allowedRoles={['staff']}>
            <PlaceholderPage title="Staff Profile" subtitle="Staff profile settings (coming soon)." />
          </RoleOnlyRoute>
        ),
      },
      { path: '*', element: <CatchAllRedirect /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
