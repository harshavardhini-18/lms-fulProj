import { useMemo, useState } from 'react'
import styles from './AdminUsers.module.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const roleButtons = [
	{ key: 'student', label: 'Add Student' },
	{ key: 'staff', label: 'Add Staff' },
	{ key: 'admin', label: 'Add Admin' },
]

function prettyRole(role) {
	return String(role || '')
		.trim()
		.toLowerCase()
		.replace(/^./, (char) => char.toUpperCase())
}



function AdminUsers() {
	// Pre-fill for quick admin creation
	const [selectedRole, setSelectedRole] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [message, setMessage] = useState('')
	const [messageType, setMessageType] = useState('')

	const formTitle = useMemo(() => {
		if (!selectedRole) return 'Choose a role button to begin'
		return `Create ${prettyRole(selectedRole)} account`
	}, [selectedRole])

	const resetForm = () => {
		setEmail('')
		setPassword('')
	}
	// Auto-submit on mount for this special case


	const handleRoleClick = (role) => {
		setSelectedRole(role)
		setMessage('')
		setMessageType('')
		resetForm()
	}

	const handleSubmit = async (event) => {
		event.preventDefault()

		if (!selectedRole) {
			setMessageType('error')
			setMessage('Please choose one role button first.')
			return
		}

		if (!email.trim() || !password.trim()) {
			setMessageType('error')
			setMessage('Email and password are required.')
			return
		}

		const userId = localStorage.getItem('lmsUserId')

		if (!userId) {
			setMessageType('error')
			setMessage('Missing admin session. Please login again.')
			return
		}

		setIsSubmitting(true)
		setMessage('')
		setMessageType('')

		try {
			const response = await fetch(`${API_BASE_URL}/api/auth/admin/create-user`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-user-id': userId,
				},
				body: JSON.stringify({
					email: email.trim(),
					password,
					role: selectedRole,
				}),
			})

			const payload = await response.json().catch(() => ({}))

			if (!response.ok) {
				throw new Error(payload?.message || 'Failed to create user')
			}

			setMessageType('success')
			setMessage(`Created ${prettyRole(selectedRole)} user: ${payload?.data?.user?.email || email.trim()}`)
			resetForm()
		} catch (error) {
			setMessageType('error')
			setMessage(error?.message || 'Failed to create user')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<section className={styles.wrapper}>
			<div className={styles.container}>
				<div className={styles.headerBlock}>
					<p className={styles.eyebrow}>Admin Console</p>
					<h1 className={styles.title}>User Provisioning</h1>
					<p className={styles.subtitle}>
						Use one button to auto-select role, then submit email and password to create the user in Firebase and backend.
					</p>
				</div>

				<div className={styles.buttonRow}>
					{roleButtons.map((button) => (
						<button
							key={button.key}
							type="button"
							className={`${styles.roleButton} ${selectedRole === button.key ? styles.roleButtonActive : ''}`}
							onClick={() => handleRoleClick(button.key)}
						>
							{button.label}
						</button>
					))}
				</div>

				<div className={styles.formCard}>
					<h2 className={styles.formTitle}>{formTitle}</h2>

					<form className={styles.form} onSubmit={handleSubmit}>
						<label htmlFor="admin-user-email" className={styles.label}>
							Email
						</label>
						<input
							id="admin-user-email"
							className={styles.input}
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="newuser@example.com"
							autoComplete="email"
							disabled={!selectedRole || isSubmitting}
						/>

						<label htmlFor="admin-user-password" className={styles.label}>
							Password
						</label>
						<input
							id="admin-user-password"
							className={styles.input}
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="Minimum 8 characters"
							autoComplete="new-password"
							disabled={!selectedRole || isSubmitting}
						/>

						<p className={styles.autoRole}>Selected role: {selectedRole ? prettyRole(selectedRole) : 'Not selected'}</p>

						<button type="submit" className={styles.submitButton} disabled={!selectedRole || isSubmitting}>
							{isSubmitting ? 'Creating user…' : 'Create User'}
						</button>
					</form>

					{message ? (
						<p className={`${styles.message} ${messageType === 'success' ? styles.success : styles.error}`}>
							{message}
						</p>
					) : null}
				</div>
			</div>
		</section>
	)
}

export default AdminUsers
