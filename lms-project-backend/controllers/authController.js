import asyncHandler from '../utils/asyncHandler.js';
import {
	createUserByAdmin,
	firebaseAdminLogin,
	getUserById,
	loginUser,
	registerUser,
	completeStudentOnboarding,
	updateUserProfile,
	requestPasswordReset,
	validateAndResetPassword,
} from '../services/authService.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { getResetTokenExpiryInfo } from '../services/passwordResetService.js';
import { pool } from '../config/postgres.js';

export const register = asyncHandler(async (req, res) => {
	const user = await registerUser(req.body);
	res.status(201).json({ success: true, data: user });
});

export const login = asyncHandler(async (req, res) => {
	const user = await loginUser(req.body);
	res.json({ success: true, data: user });
});

export const me = asyncHandler(async (req, res) => {
	const user = await getUserById(req.user.id);
	res.json({ success: true, data: user });
});

export const firebaseAdminSignIn = asyncHandler(async (req, res) => {
	const { user, firebaseUid } = await firebaseAdminLogin(req.body.idToken);
	res.json({ success: true, data: { user, firebaseUid } });
});

export const adminCreateUser = asyncHandler(async (req, res) => {
	const result = await createUserByAdmin(req.body);
	res.status(201).json({ success: true, data: result });
});

export const completeOnboarding = asyncHandler(async (req, res) => {
	const userId = req.user.id;
	const user = await completeStudentOnboarding(userId, req.body);
	res.json({ success: true, data: user, message: 'Onboarding completed successfully' });
});

export const updateStudentProfile = asyncHandler(async (req, res) => {
	const userId = req.user.id;
	const user = await updateUserProfile(userId, req.body);
	res.json({ success: true, data: user, message: 'Profile updated successfully' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
	const { email } = req.body;

	if (!email || !String(email).trim()) {
		return res.status(400).json({ success: false, message: 'Email is required' });
	}

	console.log(`[AUTH_DEBUG] Forgot password request for email: ${email}`);

	const requestIp = req.ip || req.connection.remoteAddress || 'unknown';
	const userAgent = req.headers['user-agent'] || 'unknown';

	const result = await requestPasswordReset(email, requestIp, userAgent);

	console.log(`[AUTH_DEBUG] Password reset request result: userFound=${result.userFound}`);

	if (result.userFound) {
		const { resetData } = result;
		const resetUrl = `${process.env.FRONTEND_RESET_URL}?email=${encodeURIComponent(email)}&token=${resetData.token}`;

		console.log(`[AUTH_DEBUG] Reset URL generated for email: ${email}`);

		const userResult = await pool.query(
			`SELECT full_name FROM users WHERE email = $1 LIMIT 1`,
			[String(email).toLowerCase()]
		);
		const user = userResult.rows[0];

		console.log(`[AUTH_DEBUG] Found user: ${user?.full_name}, will send reset email to: ${email}`);

		await sendPasswordResetEmail(user?.full_name || 'User', email, resetUrl, resetData.expiryMinutes);

		console.log(`[AUTH_DEBUG] Reset email sent successfully to: ${email}`);
	}

	res.status(200).json({
		success: true,
		message: 'If an account with this email exists, a password reset link has been sent to your inbox.',
		email: result.userFound ? email : undefined,
	});
});

export const validateResetToken = asyncHandler(async (req, res) => {
	const { email, token } = req.query;

	if (!email || !token) {
		return res.status(400).json({ success: false, message: 'Email and token are required' });
	}

	const tokenInfo = await getResetTokenExpiryInfo(email, token);

	if (!tokenInfo.valid) {
		return res.status(400).json({ success: false, message: tokenInfo.message });
	}

	res.json({
		success: true,
		message: 'Token is valid',
		expiresAt: tokenInfo.expiresAt,
		remainingMinutes: tokenInfo.remainingMinutes,
	});
});

export const resetPassword = asyncHandler(async (req, res) => {
	const { email, token, newPassword } = req.body;

	if (!email || !token || !newPassword) {
		return res.status(400).json({
			success: false,
			message: 'Email, token, and new password are required',
		});
	}

	const result = await validateAndResetPassword(email, token, newPassword);

	res.json({
		success: true,
		message: result.message,
	});
});