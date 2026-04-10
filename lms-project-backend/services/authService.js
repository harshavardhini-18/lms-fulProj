import crypto from 'crypto';
import AppError from '../utils/AppError.js';
import { User } from '../models/index.js';
import { getFirebaseAuth } from '../utils/firebaseAdmin.js';

const SCRYPT_KEYLEN = 64;
const ADMIN_MANAGED_ROLES = new Set(['student', 'staff', 'admin']);

function hashPassword(password) {
	return new Promise((resolve, reject) => {
		const salt = crypto.randomBytes(16).toString('hex');
		crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
			if (err) return reject(err);
			return resolve(`${salt}:${derivedKey.toString('hex')}`);
		});
	});
}

function verifyPassword(password, passwordHash) {
	return new Promise((resolve, reject) => {
		const [salt, key] = String(passwordHash || '').split(':');
		if (!salt || !key) return resolve(false);

		crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
			if (err) return reject(err);

			const original = Buffer.from(key, 'hex');
			const current = Buffer.from(derivedKey.toString('hex'), 'hex');
			if (original.length !== current.length) return resolve(false);

			return resolve(crypto.timingSafeEqual(original, current));
		});
	});
}

function sanitizeUser(userDoc) {
	const user = userDoc.toObject ? userDoc.toObject() : userDoc;
	delete user.passwordHash;
	return user;
}

function randomPasswordHash() {
	const salt = crypto.randomBytes(16).toString('hex');
	const key = crypto.randomBytes(64).toString('hex');
	return `${salt}:${key}`;
}

function getAdminEmailsAllowlist() {
	const defaultAdmins = ['harsha@gmail.com'];
	const envAdmins = String(process.env.FIREBASE_ADMIN_EMAILS || '')
		.split(',')
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean);

	return new Set(
		[...defaultAdmins, ...envAdmins]
	);
}

function normalizeFirebaseProvider(provider) {
	const value = String(provider || '').trim().toLowerCase();

	if (value === 'google.com' || value === 'google') return 'google';
	if (value === 'github.com' || value === 'github') return 'github';
	if (value === 'apple.com' || value === 'apple') return 'apple';
	if (value === 'password' || value === 'email' || value === 'custom') return 'local';

	return 'local';
}

function normalizeAdminManagedRole(role) {
	const normalized = String(role || '').trim().toLowerCase();
	if (!ADMIN_MANAGED_ROLES.has(normalized)) {
		throw new AppError('Invalid role. Allowed roles: student, staff, admin', 400);
	}

	return normalized;
}

function parseFirebaseError(error) {
	const rawCode = error?.errorInfo?.code || error?.code || '';
	const code = String(rawCode).toLowerCase();

	if (code.includes('email-already-exists')) {
		return new AppError('Email already exists in Firebase', 409);
	}

	if (code.includes('invalid-password') || code.includes('password')) {
		return new AppError('Invalid password for Firebase user creation', 400);
	}

	if (code.includes('invalid-email')) {
		return new AppError('Invalid email format', 400);
	}

	return null;
}

function deriveFullNameFromEmail(email) {
	const localPart = String(email || '').split('@')[0] || 'user';
	const normalized = localPart.replace(/[._-]+/g, ' ').trim();
	if (!normalized) return 'LMS User';

	return normalized
		.split(' ')
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' ')
		.slice(0, 120);
}

export async function registerUser(payload) {
	const { fullName, email, password } = payload;
	const exists = await User.findOne({ email: email.toLowerCase() }).lean();
	if (exists) throw new AppError('Email already registered', 409);

	const passwordHash = await hashPassword(password);
	const user = await User.create({
		fullName,
		email,
		passwordHash,
		role: payload.role || 'student',
	});

	return sanitizeUser(user);
}

export async function loginUser(payload) {
	const { email, password } = payload;
	const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
	if (!user) throw new AppError('Invalid credentials', 401);
	if (user.status !== 'active') throw new AppError('User is not active', 403);

	const valid = await verifyPassword(password, user.passwordHash);
	if (!valid) throw new AppError('Invalid credentials', 401);

	return sanitizeUser(user);
}

export async function getUserById(userId) {
	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);
	return sanitizeUser(user);
}

export async function firebaseAdminLogin(idToken) {
	if (!idToken) throw new AppError('idToken is required', 400);

	const firebaseAuth = getFirebaseAuth();
	const decoded = await firebaseAuth.verifyIdToken(idToken);
	const email = String(decoded.email || '').trim().toLowerCase();

	if (!email) {
		throw new AppError('Firebase token has no email. Use an email-enabled provider.', 400);
	}

	const allowlist = getAdminEmailsAllowlist();
	const allowedByEmail = allowlist.has(email);
	const fullName = String(decoded.name || email.split('@')[0] || 'LMS User').slice(0, 120);
	const authProvider = normalizeFirebaseProvider(decoded.firebase?.sign_in_provider);

	let user = await User.findOne({ email });

	if (!user) {
		user = await User.create({
			fullName,
			email,
			passwordHash: randomPasswordHash(),
			role: allowedByEmail ? 'admin' : 'student',
			authProvider,
			isEmailVerified: Boolean(decoded.email_verified),
			status: 'active',
		});
	} else {
		if (user.status !== 'active') {
			throw new AppError('User is not active', 403);
		}

		if (allowedByEmail && user.role !== 'admin') {
			user.role = 'admin';
		}

		user.authProvider = authProvider;
		if (decoded.email_verified) user.isEmailVerified = true;
		if (!user.fullName && fullName) user.fullName = fullName;
		await user.save();
	}

	await firebaseAuth.setCustomUserClaims(decoded.uid, {
		role: user.role,
	});

	return {
		user: sanitizeUser(user),
		firebaseUid: decoded.uid,
	};
}

export async function createUserByAdmin(payload) {
	const email = String(payload?.email || '').trim().toLowerCase();
	const password = String(payload?.password || '').trim();
	const role = normalizeAdminManagedRole(payload?.role);
	const fullName = deriveFullNameFromEmail(email);

	if (!email) {
		throw new AppError('email is required', 400);
	}

	if (!password) {
		throw new AppError('password is required', 400);
	}

	if (password.length < 8) {
		throw new AppError('Password must be at least 8 characters', 400);
	}

	const existing = await User.findOne({ email }).lean();
	if (existing) {
		throw new AppError('Email already registered', 409);
	}

	const firebaseAuth = getFirebaseAuth();
	let firebaseUid = null;

	try {
		const firebaseUser = await firebaseAuth.createUser({
			email,
			password,
			displayName: fullName,
			emailVerified: false,
			disabled: false,
		});

		firebaseUid = firebaseUser.uid;

		await firebaseAuth.setCustomUserClaims(firebaseUid, { role });

		const passwordHash = await hashPassword(password);
		const user = await User.create({
			fullName,
			email,
			passwordHash,
			role,
			authProvider: 'local',
			isEmailVerified: false,
			status: 'active',
		});

		return {
			user: sanitizeUser(user),
			firebaseUid,
		};
	} catch (error) {
		if (firebaseUid) {
			try {
				await firebaseAuth.deleteUser(firebaseUid);
			} catch {
				// best-effort rollback
			}
		}

		if (error instanceof AppError) {
			throw error;
		}

		const firebaseError = parseFirebaseError(error);
		if (firebaseError) {
			throw firebaseError;
		}

		throw error;
	}
}

