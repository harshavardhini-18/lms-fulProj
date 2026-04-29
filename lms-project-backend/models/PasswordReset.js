import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		email: {
			type: String,
			required: true,
			lowercase: true,
			index: true,
		},
		resetToken: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		resetTokenHash: {
			type: String,
			required: true,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		isUsed: {
			type: Boolean,
			default: false,
		},
		usedAt: {
			type: Date,
			default: null,
		},
		requestIp: {
			type: String,
			default: null,
		},
		userAgent: {
			type: String,
			default: null,
		},
		previousTokens: [
			{
				token: String,
				createdAt: Date,
				invalidatedAt: Date,
			},
		],
	},
	{
		timestamps: true,
	}
);

// Compound index for rate limiting queries
passwordResetSchema.index({ email: 1, createdAt: -1 });

// Auto-delete expired tokens
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('PasswordReset', passwordResetSchema);
