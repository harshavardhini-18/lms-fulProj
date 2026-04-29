import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import styles from './Login.module.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState('login') // 'login' or 'forgot-password'
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' })
  const [resetLoading, setResetLoading] = useState(false)

  const redirectTo = location.state?.from && location.state?.from !== '/login' ? location.state.from : null

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const idToken = await userCredential.user.getIdToken(true)

      const backendResponse = await fetch(`${API_BASE_URL}/api/auth/firebase/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
        }),
      })

      const backendPayload = await backendResponse.json().catch(() => ({}))
      const backendUser = backendPayload?.data?.user
      const backendUserId = backendUser?.id ?? backendUser?._id

      if (!backendResponse.ok || !backendUserId) {
        const tokenResult = await userCredential.user.getIdTokenResult()
        const fallbackRole = String(tokenResult?.claims?.role || 'student').toLowerCase()
        localStorage.removeItem('lmsUserId')
        localStorage.setItem('lmsUserRole', fallbackRole)
        const fallbackDestination =
          fallbackRole === 'admin'
            ? '/admin/dashboard'
            : fallbackRole === 'staff'
              ? '/staff/dashboard'
              : '/student/home'
        navigate(redirectTo || fallbackDestination, { replace: true })
        return
      }

      localStorage.setItem('lmsUserId', String(backendUserId))
      const normalizedRole = String(backendUser.role || '').toLowerCase()
      localStorage.setItem('lmsUserRole', normalizedRole)

      // Check if student needs onboarding
      // Treat undefined isFirstTime as true (for existing users created before onboarding feature)
      if (normalizedRole === 'student' && (backendUser.isFirstTime !== false)) {
        navigate('/student/onboarding', { replace: true })
        return
      }

      // Store auth token for future requests
      localStorage.setItem('authToken', idToken)

      const destination =
        normalizedRole === 'admin'
          ? '/admin/dashboard'
          : normalizedRole === 'staff'
            ? '/staff/dashboard'
            : '/student/home'

      navigate(redirectTo || destination, { replace: true })
    } catch (error) {
      const code = error?.code || ''
      if (
        code.includes('invalid-credential') ||
        code.includes('wrong-password') ||
        code.includes('user-not-found')
      ) {
        setErrorMessage('Invalid email or password.')
      } else if (code.includes('invalid-email')) {
        setErrorMessage('Please enter a valid email address.')
      } else {
        setErrorMessage(error?.message || 'Login failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPasswordSubmit = async (event) => {
    event.preventDefault()

    if (!resetEmail.trim()) {
      setResetMessage({
        type: 'error',
        text: '📧 Please enter your email address.',
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(resetEmail.trim())) {
      setResetMessage({
        type: 'error',
        text: '❌ Please enter a valid email address.',
      })
      return
    }

    setResetLoading(true)
    setResetMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email')
      }

      setResetMessage({
        type: 'success',
        text: `✅ Password reset email sent to ${resetEmail}. Check your inbox!`,
      })

      // Auto-clear after 5 seconds
      setTimeout(() => {
        setResetEmail('')
        setResetMessage({ type: '', text: '' })
        setViewMode('login')
      }, 5000)
    } catch (error) {
      let errorMsg = error.message || '❌ Failed to send reset email. Please try again.'

      if (errorMsg.includes('Too many')) {
        errorMsg = '⏳ Too many requests. Please try again later.'
      } else if (errorMsg.includes('invalid')) {
        errorMsg = '❌ Invalid email address.'
      }

      setResetMessage({
        type: 'error',
        text: errorMsg,
      })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <section className={styles.wrapper}>
      {/* LOGIN VIEW */}
      {viewMode === 'login' && (
        <div className={styles.loginShell}>
          <aside className={styles.heroPanel}>
            <div className={styles.heroGlow} aria-hidden="true" />
            <p className={styles.heroKicker}>Better Tomorrow LMS</p>
            <h2 className={styles.heroTitle}>Fast, Efficient and Productive Learning Workflows</h2>
            <p className={styles.heroText}>
              Access structured modules, progress tracking, and career-focused learning paths in one platform.
            </p>
            <div className={styles.heroTags}>
              <span>Project-based learning</span>
              <span>Weekly assessments</span>
              <span>Career readiness</span>
            </div>
          </aside>

          <div className={styles.card}>
            <p className={styles.eyebrow}>LMS Platform</p>
            <h1 className={styles.title}>Login</h1>
            <p className={styles.subtitle}>Sign in to continue to your course dashboard.</p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label htmlFor="login-email" className={styles.label}>
                Email
              </label>
              <input
                id="login-email"
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />

              <label htmlFor="login-password" className={styles.label}>
                Password
              </label>
              <input
                id="login-password"
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />

              <div className={styles.passwordActions}>
                <button
                  type="button"
                  className={styles.forgotPasswordLink}
                  onClick={() => setViewMode('forgot-password')}
                >
                  Forgot password?
                </button>
              </div>

              <button className={styles.button} type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Login'}
              </button>

              {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
            </form>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD VIEW */}
      {viewMode === 'forgot-password' && (
        <div className={styles.card}>
        
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>Enter your email address and we'll send you a link to reset your password.</p>

          <form className={styles.form} onSubmit={handleForgotPasswordSubmit}>
            <label htmlFor="reset-email" className={styles.label}>
              Email Address
            </label>
            <input
              id="reset-email"
              type="email"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className={styles.input}
              disabled={resetLoading}
              autoComplete="email"
            />

            <button
              type="submit"
              className={styles.button}
              disabled={resetLoading}
            >
              {resetLoading ? '⏳ Sending...' : ' Send Reset Email'}
            </button>

            {resetMessage.text && (
              <p className={`${styles.message} ${styles[resetMessage.type]}`}>
                {resetMessage.text}
              </p>
            )}

            <button
              type="button"
              className={styles.backButton}
              onClick={() => {
                setViewMode('login')
                setResetEmail('')
                setResetMessage({ type: '', text: '' })
              }}
            >
              ← Back to Login
            </button>
          </form>
        </div>
      )}
    </section>
  )
}

export default Login
