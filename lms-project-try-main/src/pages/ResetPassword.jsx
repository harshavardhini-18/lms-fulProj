import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import styles from './ResetPassword.module.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const email = searchParams.get('email')
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  // Validate token on page load
  useEffect(() => {
    validateToken()
  }, [])

  const validateToken = async () => {
    if (!email || !token) {
      setMessage({
        type: 'error',
        text: '❌ Invalid reset link. Email and token are required.',
      })
      setIsValidatingToken(false)
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/validate-reset-token?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: `❌ ${data.message || 'Invalid or expired reset link'}`,
        })
        setTokenValid(false)
      } else {
        setTokenValid(true)
        // Keep token validation internal; no info banner in the form view.
        setMessage({ type: '', text: '' })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: '❌ Failed to validate reset token. Please try again.',
      })
      setTokenValid(false)
    } finally {
      setIsValidatingToken(false)
    }
  }

  const validatePasswords = () => {
    if (!newPassword.trim()) {
      setMessage({
        type: 'error',
        text: '🔐 Please enter a new password.',
      })
      return false
    }

    if (newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: '🔐 Password must be at least 8 characters long.',
      })
      return false
    }

    if (!confirmPassword.trim()) {
      setMessage({
        type: 'error',
        text: '🔐 Please confirm your password.',
      })
      return false
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: '❌ Passwords do not match. Please try again.',
      })
      return false
    }

    return true
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validatePasswords()) {
      return
    }

    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          token: token.trim(),
          newPassword: newPassword.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password')
      }

      setMessage({
        type: 'success',
        text: '✅ Password reset successfully! Redirecting to login...',
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    } catch (error) {
      let errorMsg = error.message || '❌ Failed to reset password. Please try again.'

      if (errorMsg.includes('expired')) {
        errorMsg = '⏳ Your reset token has expired. Please request a new password reset.'
      } else if (errorMsg.includes('already been used')) {
        errorMsg = '❌ This reset link has already been used. Please request a new one.'
      } else if (errorMsg.includes('different')) {
        errorMsg = '❌ Your new password must be different from your old password.'
      }

      setMessage({
        type: 'error',
        text: errorMsg,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>LMS Platform</p>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.subtitle}>Create a new password for your account.</p>

        {isValidatingToken ? (
          <div className={styles.loadingState}>
            <p>🔄 Validating reset link...</p>
          </div>
        ) : !tokenValid ? (
          <div className={styles.errorState}>
            <p className={styles.errorTitle}>Invalid Reset Link</p>
            <p className={styles.errorMessage}>{message.text}</p>
            <button
              className={styles.backButton}
              onClick={() => navigate('/login', { replace: true })}
            >
              ← Back to Login
            </button>
          </div>
        ) : (
          <>
            {message.text && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="new-password" className={styles.label}>
                  New Password
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="new-password"
                    className={styles.input}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className={styles.hint}>Minimum 8 characters</p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirm-password" className={styles.label}>
                  Confirm Password
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="confirm-password"
                    className={styles.input}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={styles.button}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            <div className={styles.divider}>or</div>

            <button
              className={styles.backToLogin}
              onClick={() => navigate('/login', { replace: true })}
              disabled={isSubmitting}
            >
              ← Back to Login
            </button>
          </>
        )}
      </div>
    </section>
  )
}

export default ResetPassword
