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

      if (!backendResponse.ok || !backendUser?._id) {
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

      localStorage.setItem('lmsUserId', backendUser._id)
      const normalizedRole = String(backendUser.role || '').toLowerCase()
      localStorage.setItem('lmsUserRole', normalizedRole)

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

  return (
    <section className={styles.wrapper}>
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

          <button className={styles.button} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Login'}
          </button>

          {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
        </form>
      </div>
    </section>
  )
}

export default Login
