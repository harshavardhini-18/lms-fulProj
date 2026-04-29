import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'
import styles from './ForgotPasswordModal.module.css'

function ForgotPasswordModal({ isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [step, setStep] = useState('email') // 'email' or 'check-email'

  const handleEmailSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter your email address.',
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid email address.',
      })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      })

      setStep('check-email')
      setMessage({
        type: 'success',
        text: `Password reset email sent to ${email}. Please check your inbox and spam folder.`,
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        if (onSuccess) onSuccess()
        handleClose()
      }, 5000)
    } catch (error) {
      const code = error?.code || ''
      let errorMsg = 'Failed to send reset email. Please try again.'

      if (code.includes('user-not-found')) {
        errorMsg = 'No account found with this email address.'
      } else if (code.includes('invalid-email')) {
        errorMsg = 'Invalid email address.'
      } else if (code.includes('too-many-requests')) {
        errorMsg = 'Too many reset requests. Please try again later.'
      }

      setMessage({
        type: 'error',
        text: errorMsg,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setMessage({ type: '', text: '' })
    setStep('email')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={handleClose} />

      {/* Modal */}
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Reset Password</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className={styles.form}>
            <p className={styles.description}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <label htmlFor="forgot-email" className={styles.label}>
              Email Address
            </label>
            <input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              disabled={loading}
              autoComplete="email"
            />

            <button
              type="submit"
              className={styles.button}
              disabled={loading}
            >
              {loading ? '⏳ Sending...' : '📧 Send Reset Email'}
            </button>

            {message.text && (
              <p className={`${styles.message} ${styles[message.type]}`}>
                {message.type === 'error' ? '⚠️' : '✅'} {message.text}
              </p>
            )}
          </form>
        ) : (
          <div className={styles.successContent}>
            <div className={styles.successIcon}>📬</div>
            <p className={styles.successMessage}>
              Password reset email has been sent!
            </p>
            <p className={styles.successDetails}>
              Check your email at <strong>{email}</strong> for a link to reset your password.
            </p>
            <p className={styles.successHint}>
              💡 If you don't see the email, check your spam folder.
            </p>
            <button
              className={styles.button}
              onClick={handleClose}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default ForgotPasswordModal
