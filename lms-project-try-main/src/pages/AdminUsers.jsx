import { useMemo, useState } from 'react'
import styles from './AdminUsers.module.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const roleOptions = [
	{
		key: 'student',
		title: 'Student',
		label: 'Create Student',
		description: 'Learner account with access to courses and notes.',
		icon: '🎓',
	},
	{
		key: 'staff',
		title: 'Staff',
		label: 'Create Staff',
		description: 'Team account for course support and reporting.',
		icon: '🧑‍💼',
	},
	{
		key: 'admin',
		title: 'Admin',
		label: 'Create Admin',
		description: 'Full access to users, courses, and platform settings.',
		icon: '🛡️',
	},
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
	const [lastCreatedEmail, setLastCreatedEmail] = useState('')
	const [lastCreatedRole, setLastCreatedRole] = useState('')
	const showSidePanel = false

	const formTitle = useMemo(() => {
		if (!selectedRole) return 'Account details'
		return `Account details — ${prettyRole(selectedRole)}`
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

			const createdEmail = payload?.data?.user?.email || email.trim()
			setLastCreatedEmail(createdEmail)
			setLastCreatedRole(selectedRole)
			setMessageType('success')
			setMessage(`Created ${prettyRole(selectedRole)} user: ${createdEmail}`)
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
				<div className={styles.grid}>
					{/* LEFT */}
					<div className={styles.main}>
						<div className={styles.shell}>
							<div className={styles.shellHeader}>
								<p className={styles.eyebrow}>Admin Console</p>
								<h1 className={styles.title}>User Provisioning</h1>
								<p className={styles.subtitle}>
									Create Student, Staff, or Admin accounts. Select a role, then enter email and password to create the user.
								</p>
							</div>

							<div className={styles.shellBody}>
								<section className={styles.subSection} aria-label="Role selection">
									<div className={styles.sectionHeaderRow}>
										<h2 className={styles.sectionTitle}>Choose role</h2>
										<p className={styles.sectionHint}>Select one to continue.</p>
									</div>

									<div className={styles.roleGrid}>
										{roleOptions.map((role) => (
											<button
												key={role.key}
												type="button"
												className={`${styles.roleCard} ${selectedRole === role.key ? styles.roleCardActive : ''}`}
												onClick={() => handleRoleClick(role.key)}
											>
												<span className={styles.roleIcon} aria-hidden="true">
													{role.icon}
												</span>
												<span className={styles.roleMeta}>
													<span className={styles.roleTitle}>{role.title}</span>
													<span className={styles.roleDescription}>{role.description}</span>
												</span>
												{selectedRole === role.key ? (
													<span className={styles.roleSelectedPill} aria-label="Selected">
														✓ Selected
													</span>
												) : null}
											</button>
										))}
									</div>
								</section>

								{selectedRole ? <div className={styles.divider} /> : null}

								{selectedRole ? (
									<section className={styles.subSection} aria-label="User creation form">
										<div className={styles.sectionHeaderRow}>
											<h2 className={styles.sectionTitle}>{formTitle}</h2>
											<p className={styles.sectionHint}>
												Selected role: <span className={styles.roleValue}>{prettyRole(selectedRole)}</span>
											</p>
										</div>

										<form className={styles.form} onSubmit={handleSubmit}>
											<div className={styles.fieldGrid}>
												<div className={styles.field}>
													<label htmlFor="admin-user-email" className={styles.label}>
														Email
													</label>
													<div className={styles.inputShell}>
														<span className={styles.inputIcon} aria-hidden="true">
															✉
														</span>
														<input
															id="admin-user-email"
															className={styles.input}
															type="email"
															value={email}
															onChange={(event) => setEmail(event.target.value)}
															placeholder="newuser@example.com"
															autoComplete="email"
															disabled={isSubmitting}
														/>
													</div>
												</div>

												<div className={styles.field}>
													<label htmlFor="admin-user-password" className={styles.label}>
														Password
													</label>
													<div className={styles.inputShell}>
														<span className={styles.inputIcon} aria-hidden="true">
															🔒
														</span>
														<input
															id="admin-user-password"
															className={styles.input}
															type="password"
															value={password}
															onChange={(event) => setPassword(event.target.value)}
															placeholder="Minimum 8 characters"
															autoComplete="new-password"
															disabled={isSubmitting}
														/>
													</div>
													<p className={styles.helpText}>Minimum 8 characters.</p>
												</div>
											</div>

											<div className={styles.formActions}>
												<button type="submit" className={styles.submitButton} disabled={isSubmitting}>
													<span className={styles.submitIcon} aria-hidden="true">
														➕
													</span>
													{isSubmitting ? 'Creating user…' : 'Create User'}
												</button>
											</div>
										</form>

										{message ? (
											<p className={`${styles.message} ${messageType === 'success' ? styles.success : styles.error}`}>
												{message}
											</p>
										) : null}
									</section>
								) : null}
							</div>
						</div>
					</div>

					{/* RIGHT */}
					{showSidePanel ? (
					<aside className={styles.side} aria-label="Supporting information">
						<div className={styles.sideCard}>
							<h3 className={styles.sideTitle}>This session</h3>
							<div className={styles.statsGrid}>
								<div className={styles.statItem}>
									<p className={styles.statLabel}>Selected role</p>
									<p className={styles.statValue}>{selectedRole ? prettyRole(selectedRole) : '—'}</p>
								</div>
								<div className={styles.statItem}>
									<p className={styles.statLabel}>Last created</p>
									<p className={styles.statValue}>{lastCreatedEmail ? lastCreatedEmail : '—'}</p>
									{lastCreatedEmail ? (
										<p className={styles.statSubtle}>Role: {lastCreatedRole ? prettyRole(lastCreatedRole) : '—'}</p>
									) : null}
								</div>
							</div>
						</div>

						<div className={styles.sideCard}>
							<h3 className={styles.sideTitle}>Quick checklist</h3>
							<ul className={styles.checklist}>
								<li>Choose the correct role before creating a user.</li>
								<li>Use a strong password (8+ characters).</li>
								<li>New users will be created in Firebase and MongoDB.</li>
							</ul>
						</div>

						<div className={styles.sideCard}>
							<h3 className={styles.sideTitle}>Recent activity</h3>
							<div className={styles.activityList}>
								<div className={styles.activityItem}>
									<p className={styles.activityTitle}>User provisioning</p>
									<p className={styles.activityMeta}>Track creations in your backend logs & MongoDB Atlas.</p>
								</div>
								<div className={styles.activityItem}>
									<p className={styles.activityTitle}>Role-based access</p>
									<p className={styles.activityMeta}>Admin routes are protected and hidden for students.</p>
								</div>
							</div>
						</div>
					</aside>
					) : null}
				</div>
			</div>
		</section>
	)
}

export default AdminUsers
