import crypto from 'crypto';
import AppError from '../utils/AppError.js';
import { pool } from '../config/postgres.js';
import { getFirebaseAuth } from '../utils/firebaseAdmin.js';
import { completePasswordReset, generatePasswordResetToken } from './passwordResetService.js';

/* ---------------- CONFIG ---------------- */

const SCRYPT_KEYLEN = 64;

/* ---------------- PASSWORD HELPERS ---------------- */

function hashPassword(password) {
	return new Promise((resolve, reject) => {
		const salt = crypto.randomBytes(16).toString('hex');

		crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, key) => {
			if (err) return reject(err);
			resolve(`${salt}:${key.toString('hex')}`);
		});
	});
}

function verifyPassword(password, hash) {
	return new Promise((resolve, reject) => {
		if (!hash) return resolve(false);

		const [salt, key] = hash.split(':');
		if (!salt || !key) return resolve(false);

		crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
			if (err) return reject(err);

			resolve(
				crypto.timingSafeEqual(
					Buffer.from(key, 'hex'),
					derivedKey
				)
			);
		});
	});
}

/* ---------------- SANITIZE ---------------- */

function sanitizeUser(user) {
	if (!user) return null;
	delete user.password_hash;
	return user;
}

function roleNameFromRoleId(roleId) {
	if (Number(roleId) === 1) return 'admin';
	if (Number(roleId) === 2) return 'staff';
	return 'student';
}

/* ---------------- FIREBASE LOGIN ---------------- */

export async function firebaseAdminLogin(idToken) {
	if (!idToken) throw new AppError('idToken required', 400);

	const auth = getFirebaseAuth();
	let decoded;
	try {
		decoded = await auth.verifyIdToken(idToken);
	} catch {
		throw new AppError('Invalid Firebase token. Please login again.', 401);
	}

	const email = decoded.email?.toLowerCase();
	if (!email) throw new AppError('Email missing in token', 400);

	const result = await pool.query(
		`SELECT u.*
		 FROM users u
		 WHERE u.email = $1`,
		[email]
	);

	let user = result.rows[0];

	// Auto-provision a student user in PostgreSQL on first Firebase signup.
	if (!user) {
		const roleRes = await pool.query(
			`SELECT id FROM roles WHERE role_name = 'student'`
		);

		if (!roleRes.rows[0]) {
			throw new AppError('Student role missing in roles table', 500);
		}

		const fullName = (decoded.name || email.split('@')[0] || 'Student').toString().trim() || 'Student';

		const inserted = await pool.query(
			`INSERT INTO users (full_name, email, password_hash, role_id, status, firebase_uid, is_first_time)
			 VALUES ($1, $2, NULL, $3, 'active', $4, TRUE)
			 RETURNING *`,
			[fullName, email, roleRes.rows[0].id, decoded.uid]
		);

		user = inserted.rows[0];
	}

	if (user.status !== 'active') throw new AppError('User inactive', 403);
	user.role = roleNameFromRoleId(user.role_id);

	// update firebase uid if missing
	if (!user.firebase_uid) {
		await pool.query(
			`UPDATE users SET firebase_uid = $1 WHERE email = $2`,
			[decoded.uid, email]
		);
	}

	try {
		await auth.setCustomUserClaims(decoded.uid, { role: user.role });
	} catch {
		// non-blocking in local/dev
	}

	return {
		user: sanitizeUser(user),
		firebaseUid: decoded.uid,
	};
}

/* ---------------- LOGIN ---------------- */

export async function loginUser({ email, password }) {
	const result = await pool.query(
		`SELECT * FROM users WHERE email = $1`,
		[email.toLowerCase()]
	);

	const user = result.rows[0];

	if (!user) throw new AppError('Invalid credentials', 401);
	if (user.status !== 'active') throw new AppError('User inactive', 403);

	const valid = await verifyPassword(password, user.password_hash);

	if (!valid) throw new AppError('Invalid credentials', 401);

	return sanitizeUser(user);
}

/* ---------------- REGISTER ---------------- */

export async function registerUser({ fullName, email, password }) {
	email = email.toLowerCase().trim();

	const exists = await pool.query(
		`SELECT 1 FROM users WHERE email = $1`,
		[email]
	);

	if (exists.rows.length > 0) {
		throw new AppError('Email already registered', 409);
	}

	const roleRes = await pool.query(
		`SELECT id FROM roles WHERE role_name = 'student'`
	);

	if (!roleRes.rows[0]) {
		throw new AppError('Student role missing', 500);
	}

	const passwordHash = await hashPassword(password);

	const result = await pool.query(
		`INSERT INTO users (full_name, email, password_hash, role_id, status)
		 VALUES ($1, $2, $3, $4, 'active')
		 RETURNING *`,
		[fullName, email, passwordHash, roleRes.rows[0].id]
	);

	return sanitizeUser(result.rows[0]);
}

/* ---------------- GET USER ---------------- */

export async function getUserById(userId) {
	const result = await pool.query(
		`SELECT u.*
		 FROM users u
		 WHERE u.id = $1`,
		[userId]
	);

	if (!result.rows[0]) {
		throw new AppError('User not found', 404);
	}

	const user = result.rows[0];
	user.role = roleNameFromRoleId(user.role_id);
	return sanitizeUser(user);
}

/* ---------------- ADMIN CREATE USER ---------------- */

export async function createUserByAdmin(payload) {
	const { fullName, email, password, role_id } = payload;

	if (!email || !password || !role_id) {
		throw new AppError('Missing required fields', 400);
	}

	const exists = await pool.query(
		`SELECT 1 FROM users WHERE email = $1`,
		[email.toLowerCase()]
	);

	if (exists.rows.length > 0) {
		throw new AppError('User already exists', 409);
	}

	const hash = await hashPassword(password);

	const result = await pool.query(
		`INSERT INTO users (full_name, email, password_hash, role_id, status)
		 VALUES ($1, $2, $3, $4, 'active')
		 RETURNING *`,
		[fullName, email.toLowerCase(), hash, role_id]
	);

	return sanitizeUser(result.rows[0]);
}

/* ---------------- UPDATE PROFILE ---------------- */

export async function updateUserProfile(userId, payload) {
	await pool.query(
		`UPDATE users SET full_name = $1 WHERE id = $2`,
		[payload.fullName, userId]
	);

	return { success: true };
}

/* ---------------- ONBOARDING ---------------- */

export async function completeStudentOnboarding(userId, payload) {
	await pool.query(
		`UPDATE users SET
		 first_name=$1,
		 last_name=$2,
		 phone=$3,
		 department=$4,
		 year_of_study=$5,
		 college_name=$6,
		 roll_no=$7,
		 is_first_time=false
		 WHERE id=$8`,
		[
			payload.firstName,
			payload.lastName,
			payload.phone,
			payload.department,
			payload.yearOfStudy,
			payload.collegeName,
			payload.rollNo,
			userId,
		]
	);

	return { success: true };
}

/* ---------------- PASSWORD RESET ---------------- */

export async function requestPasswordReset(email, requestIp, userAgent) {
	const emailLower = String(email || '').trim().toLowerCase();

	if (!emailLower) {
		throw new AppError('Email is required', 400);
	}

	const userResult = await pool.query(
		`SELECT id FROM users WHERE email = $1 LIMIT 1`,
		[emailLower]
	);
	const user = userResult.rows[0];

	if (!user) {
		return { userFound: false };
	}

	const resetData = await generatePasswordResetToken(
		emailLower,
		user.id,
		requestIp,
		userAgent
	);

	return {
		userFound: true,
		resetData,
	};
}

export async function validateAndResetPassword(email, token, newPassword) {
	if (!email || !token || !newPassword) {
		throw new AppError('Email, token, and new password are required', 400);
	}

	if (String(newPassword).length < 8) {
		throw new AppError('Password must be at least 8 characters', 400);
	}

	return completePasswordReset(email, token, newPassword);
}