import mongoose from 'mongoose';

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;

const RefreshTokenSchema = new Schema(
	{
		user: { type: objectId, ref: 'User', required: true, index: true },
		tokenHash: { type: String, required: true, index: true },
		expiresAt: { type: Date, required: true },
		revokedAt: { type: Date },
		userAgent: { type: String, default: '' },
		ip: { type: String, default: '' },
	},
	{ timestamps: true }
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.models.RefreshToken || mongoose.model('RefreshToken', RefreshTokenSchema);

export default RefreshToken;

