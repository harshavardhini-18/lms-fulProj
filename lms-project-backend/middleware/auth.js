import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import { User } from '../models/index.js';

export async function attachUser(req, res, next) {
	try {
		const userId = req.headers['x-user-id'];

		if (!userId) {
			req.user = null;
			return next();
		}

		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return next(new AppError('Invalid x-user-id header', 400));
		}

		const user = await User.findById(userId);

		if (!user || user.status !== 'active') {
			return next(new AppError('User not found or inactive', 401));
		}

		req.user = user;
		return next();
	} catch (error) {
		return next(error);
	}
}

export function requireUser(req, res, next) {
	if (!req.user) {
		return next(new AppError('Authentication required. Provide x-user-id header.', 401));
	}

	return next();
}

export function requireAdmin(req, res, next) {
	if (!req.user) {
		return next(new AppError('Authentication required. Provide x-user-id header.', 401));
	}

	if (req.user.role !== 'admin') {
		return next(new AppError('Admin access required', 403));
	}

	return next();
}

