import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import Navbar from './components/Navbar'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Login from './pages/Login'
import AdminUsers from './pages/AdminUsers'
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
    return <Navigate to="/courses" replace />
  }

  return children
}

function AdminOnlyRoute({ isLoading, user, role, children }) {
  if (isLoading) {
    return <div className="routeLoading">Checking login…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (String(role || '').toLowerCase() !== 'admin') {
    return <Navigate to="/courses" replace />
  }

  return children
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

        if (!response.ok || !backendUser?._id) {
          throw new Error(payload?.message || 'Failed to sync user role')
        }

        const normalizedRole = String(backendUser.role || '').toLowerCase()
        localStorage.setItem('lmsUserId', backendUser._id)
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

  const showNavbar = location.pathname !== '/login'

  return (
    <div className="appShell">
      {showNavbar ? <Navbar isAdmin={authRole === 'admin'} /> : null}

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
            path="/"
            element={
              <ProtectedRoute isLoading={isAuthLoading} user={authUser}>
                <PlaceholderPage
                  title="Welcome to LMS Learning"
                  subtitle="Explore curated courses, build skills faster, and earn certifications at your pace."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute isLoading={isAuthLoading} user={authUser}>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id"
            element={
              <ProtectedRoute isLoading={isAuthLoading} user={authUser}>
                <CourseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/career"
            element={
              <ProtectedRoute isLoading={isAuthLoading} user={authUser}>
                <PlaceholderPage
                  title="Career Tracks"
                  subtitle="Career roadmap modules are coming soon with mentor-led paths and interview prep."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute isLoading={isAuthLoading} user={authUser}>
                <PlaceholderPage
                  title="Your Profile"
                  subtitle="Track your progress, certificates, and recommended next courses here."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminOnlyRoute isLoading={isAuthLoading} user={authUser} role={authRole}>
                <AdminUsers />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={authUser ? '/courses' : '/login'} replace />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
