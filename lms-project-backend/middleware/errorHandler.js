import AppError from '../utils/AppError.js';

export function notFoundHandler(req, res, next) {
	next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, req, res, next) {
	let error = err;

	if (err?.code === 11000) {
		const field = Object.keys(err.keyPattern || {})[0] || 'field';
		error = new AppError(`Duplicate value for ${field}`, 409, err.keyValue);
	}

	if (err?.name === 'ValidationError') {
		error = new AppError(
			'Validation failed',
			400,
			Object.values(err.errors || {}).map((e) => e.message)
		);
	}

	if (err?.code?.startsWith?.('auth/') || err?.errorInfo?.code?.startsWith?.('auth/')) {
		error = new AppError('Invalid Firebase token. Please login again.', 401);
	}

	const statusCode = error.statusCode || 500;
	const payload = {
		success: false,
		message: error.message || 'Internal server error',
	};

	if (error.details) payload.details = error.details;
	if (process.env.NODE_ENV !== 'production' && err?.stack) payload.stack = err.stack;
	if (statusCode >= 500) {
		console.error(`[API_ERROR] ${req.method} ${req.originalUrl}:`, err?.stack || err?.message || err);
	}

	res.status(statusCode).json(payload);
}

