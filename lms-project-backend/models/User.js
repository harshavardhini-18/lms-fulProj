import mongoose from 'mongoose';

const { Schema } = mongoose;


const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 180 },
    // passwordHash removed: password is managed by Firebase only
    role: {
			type: String,
			enum: ['student', 'staff', 'instructor', 'admin'],
			default: 'student',
			index: true,
		},
		authProvider: {
			type: String,
			enum: ['local', 'google', 'github', 'apple'],
			default: 'local',
			index: true,
		},
		isEmailVerified: { type: Boolean, default: false },
		status: {
			type: String,
			enum: ['active', 'blocked', 'deleted'],
			default: 'active',
			index: true,
		},
		avatarUrl: { type: String, default: '' },
		profile: {
			headline: { type: String, default: '', maxlength: 200 },
			bio: { type: String, default: '', maxlength: 2000 },
		},
	},
	{ timestamps: true, versionKey: false}
);

UserSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;

