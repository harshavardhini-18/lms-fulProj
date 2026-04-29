import crypto from 'crypto';
import AppError from '../utils/AppError.js';
import { pool } from '../config/postgres.js';

const SCRYPT_KEYLEN = 64;
const RESET_TOKEN_EXPIRY = parseInt(process.env.RESET_TOKEN_EXPIRY || '1800000'); // 30 minutes
const RATE_LIMIT_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS || '4');
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '900000'); // 15 minutes

function generateResetToken() {
	return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
	return crypto.createHash('sha256').update(token).digest('hex');
}

function hashPassword(password) {
	return new Promise((resolve, reject) => {
		const salt = crypto.randomBytes(16).toString('hex');
		crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
			if (err) return reject(err);
			return resolve(`${salt}:${derivedKey.toString('hex')}`);
		});
	});
}

function verifyPassword(password, hash) {
	return new Promise((resolve, reject) => {
		if (!hash) return resolve(false);

		const [salt, key] = String(hash).split(':');
		if (!salt || !key) return resolve(false);

		crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
			if (err) return reject(err);
			resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
		});
	});
}

export async function ensurePasswordResetTable() {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS password_resets (
			id BIGSERIAL PRIMARY KEY,
			user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			email VARCHAR(255) NOT NULL,
			reset_token_hash VARCHAR(128) NOT NULL UNIQUE,
			expires_at TIMESTAMPTZ NOT NULL,
			is_used BOOLEAN NOT NULL DEFAULT FALSE,
			used_at TIMESTAMPTZ NULL,
			request_ip VARCHAR(255) NULL,
			user_agent TEXT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`);

	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_password_resets_email_created_at
		ON password_resets(email, created_at DESC)
	`);

	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at
		ON password_resets(expires_at)
	`);
}

export async function checkResetRateLimit(email) {
	const emailLower = String(email || '').trim().toLowerCase();
	const timeWindow = new Date(Date.now() - RATE_LIMIT_WINDOW);

	const countResult = await pool.query(
		`SELECT COUNT(*)::INT AS count
		 FROM password_resets
		 WHERE email = $1 AND created_at >= $2`,
		[emailLower, timeWindow]
	);
	const count = countResult.rows[0]?.count || 0;

	if (count >= RATE_LIMIT_REQUESTS) {
		const oldestResult = await pool.query(
			`SELECT created_at
			 FROM password_resets
			 WHERE email = $1 AND created_at >= $2
			 ORDER BY created_at ASC
			 LIMIT 1`,
			[emailLower, timeWindow]
		);
		const oldestRequestTime = oldestResult.rows[0]?.created_at
			? new Date(oldestResult.rows[0].created_at).getTime()
			: Date.now();

		const waitMs = Math.max(0, RATE_LIMIT_WINDOW - (Date.now() - oldestRequestTime));

		const waitMinutes = Math.ceil(waitMs / 60000);

		throw new AppError(
			`Too many reset requests. Please try again in ${waitMinutes} minute${waitMinutes !== 1 ? 's' : ''}.`,
			429
		);
	}

	return { allowed: true, remaining: RATE_LIMIT_REQUESTS - count };
}

export async function generatePasswordResetToken(email, userId, requestIp, userAgent) {
	const emailLower = String(email || '').trim().toLowerCase();

	// Check rate limiting
	await checkResetRateLimit(emailLower);

	await pool.query(
		`UPDATE password_resets
		 SET is_used = TRUE, used_at = NOW()
		 WHERE email = $1 AND is_used = FALSE AND expires_at > NOW()`,
		[emailLower]
	);

	const token = generateResetToken();
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY);

	await pool.query(
		`INSERT INTO password_resets
			(user_id, email, reset_token_hash, expires_at, request_ip, user_agent)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		[userId, emailLower, tokenHash, expiresAt, requestIp || null, userAgent || null]
	);

	return {
		token,
		expiresAt,
		expiryMinutes: Math.round(RESET_TOKEN_EXPIRY / 60000),
	};
}

export async function validateResetToken(email, token) {
	const emailLower = String(email || '').trim().toLowerCase();
	const tokenHash = hashToken(token);

	const result = await pool.query(
		`SELECT *
		 FROM password_resets
		 WHERE email = $1
		   AND reset_token_hash = $2
		   AND is_used = FALSE
		   AND expires_at > NOW()
		 LIMIT 1`,
		[emailLower, tokenHash]
	);
	const resetRecord = result.rows[0];

	if (!resetRecord) {
		throw new AppError('Invalid or expired reset token', 400);
	}

	return resetRecord;
}

export async function completePasswordReset(email, token, newPassword) {
	const emailLower = String(email || '').trim().toLowerCase();

	const resetRecord = await validateResetToken(emailLower, token);

	const userResult = await pool.query(
		`SELECT id, email, password_hash, firebase_uid
		 FROM users
		 WHERE email = $1
		 LIMIT 1`,
		[emailLower]
	);
	const user = userResult.rows[0];

	if (!user) {
		throw new AppError('User not found', 404);
	}

	const isSamePassword = await verifyPassword(newPassword, user.password_hash);
	if (isSamePassword) {
		throw new AppError('New password must be different from current password', 400);
	}

	const passwordHash = await hashPassword(newPassword);

	await pool.query(
		`UPDATE users
		 SET password_hash = $1
		 WHERE id = $2`,
		[passwordHash, user.id]
	);

	try {
		const { getFirebaseAuth } = await import('../utils/firebaseAdmin.js');
		const firebaseAuth = getFirebaseAuth();

		let firebaseUser = null;
		try {
			firebaseUser = await firebaseAuth.getUserByEmail(emailLower);
		} catch (err) {
			console.log('User not found in Firebase by email, trying by UID...');
			if (user.firebase_uid) {
				try {
					firebaseUser = await firebaseAuth.getUser(user.firebase_uid);
				} catch {
					console.log('User not found by UID either');
				}
			}
		}

		if (firebaseUser) {
			await firebaseAuth.updateUser(firebaseUser.uid, {
				password: newPassword,
			});
			console.log('✅ Firebase password updated successfully');
		} else {
			console.warn('⚠️ Firebase user not found - password reset in PostgreSQL only');
		}
	} catch (firebaseError) {
		console.error('⚠️ Firebase password update error:', firebaseError.message);
	}

	await pool.query(
		`UPDATE password_resets
		 SET is_used = TRUE, used_at = NOW()
		 WHERE id = $1`,
		[resetRecord.id]
	);

	return {
		success: true,
		message: 'Password reset successfully. Please login with your new password.',
	};
}

export async function getResetTokenExpiryInfo(email, token) {
	const emailLower = String(email || '').trim().toLowerCase();
	const tokenHash = hashToken(token);

	const result = await pool.query(
		`SELECT *
		 FROM password_resets
		 WHERE email = $1
		   AND reset_token_hash = $2
		 LIMIT 1`,
		[emailLower, tokenHash]
	);
	const resetRecord = result.rows[0];

	if (!resetRecord) {
		return { valid: false, message: 'Token not found' };
	}

	if (resetRecord.is_used) {
		return { valid: false, message: 'Token has already been used' };
	}

	const now = new Date();
	const expiresAt = new Date(resetRecord.expires_at);

	if (expiresAt < now) {
		return { valid: false, message: 'Token has expired' };
	}

	const remainingMs = expiresAt.getTime() - now.getTime();
	const remainingMinutes = Math.round(remainingMs / 60000);

	return {
		valid: true,
		expiresAt: expiresAt.toISOString(),
		remainingMinutes,
		message: `Token valid for ${remainingMinutes} more minute${remainingMinutes !== 1 ? 's' : ''}`,
	};
}

export function getResetTokenExpiryMinutes() {
	return Math.round(RESET_TOKEN_EXPIRY / 60000);
}
