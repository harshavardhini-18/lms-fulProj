import AppError from '../utils/AppError.js';
import { pool } from '../config/postgres.js';

function roleNameFromRoleId(roleId) {
	if (Number(roleId) === 1) return 'admin';
	if (Number(roleId) === 2) return 'staff';
	return 'student';
}

function getDevDefaultUserId() {
	if (process.env.NODE_ENV === 'production') return null;
	const fromEnv = process.env.DEV_DEFAULT_USER_ID;
	if (fromEnv && !Number.isNaN(Number(fromEnv))) return Number(fromEnv);
	return 1;
}

export async function attachUser(req, res, next) {
	try {

		const headerUserId = req.headers['x-user-id'] || req.headers['x-userid'];
		const devFallbackUserId =
			process.env.NODE_ENV !== 'production'
				? req.body?.userId || req.body?.user_id || req.query?.userId || req.query?.user_id
				: null;
		const defaultDevUserId = getDevDefaultUserId();
		const userId = headerUserId || devFallbackUserId || defaultDevUserId;

		// no header → allow request but user = null
		if (!userId) {
			req.user = null;
			return next();
		}

		// PostgreSQL uses numeric IDs
		if (isNaN(Number(userId))) {
			return next(new AppError('Invalid x-user-id header', 400));
		}

		const result = await pool.query(
			`SELECT u.id, u.email, u.status, u.role_id
			 FROM users u
			 WHERE u.id = $1`,
			[Number(userId)]
		);

		const user = result.rows[0];

		if (!user) {
			return next(new AppError('User not found', 401));
		}

		if (user.status !== 'active') {
			return next(new AppError('User inactive', 401));
		}

		user.role = roleNameFromRoleId(user.role_id);
		req.user = user;

		next();

	} catch (error) {

		next(error);

	}
}


export function requireUser(req, res, next) {

	if (!req.user) {
		return next(
			new AppError(
				'Authentication required. Provide x-user-id header (or userId in body/query for local dev).',
				401
			)
		);
	}

	next();

}


export function requireAdmin(req, res, next) {

	if (!req.user) {
		return next(new AppError('Authentication required. Provide x-user-id header.', 401));
	}

	if (req.user.role !== 'admin') {
		return next(new AppError('Admin access required', 403));
	}

	next();

}