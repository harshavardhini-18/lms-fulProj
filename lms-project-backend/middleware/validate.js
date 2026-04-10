import AppError from '../utils/AppError.js';

export const validate = (validator) => (req, res, next) => {
	const result = validator({
		body: req.body,
		params: req.params,
		query: req.query,
	});

	if (!result.valid) {
		return next(new AppError('Validation failed', 400, result.errors || []));
	}

	return next();
};

export const requireFields = (...fields) =>
	validate(({ body }) => {
		const errors = fields
			.filter((field) => body[field] === undefined || body[field] === null || body[field] === '')
			.map((field) => `${field} is required`);

		return {
			valid: errors.length === 0,
			errors,
		};
	});

