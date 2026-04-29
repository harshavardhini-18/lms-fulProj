import mongoose from 'mongoose';

const { Schema } = mongoose;


const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 180 },
    passwordHash: { type: String, default: null, select: false },
    firebaseUid: { type: String, default: null, sparse: true, index: true },
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
		// Onboarding fields (students only)
		isFirstTime: { type: Boolean, default: true },
		onboarding: {
			firstName: { type: String, default: '', trim: true, maxlength: 60 },
			lastName: { type: String, default: '', trim: true, maxlength: 60 },
			phone: { type: String, default: '', trim: true, maxlength: 15 },
			department: { type: String, default: '', trim: true, maxlength: 100 },
			yearOfStudy: { type: String, default: '', maxlength: 20 },
			collegeName: { type: String, default: '', trim: true, maxlength: 150 },
			rollNo: { type: String, default: '', trim: true, maxlength: 50 },
			completedAt: { type: Date },
		},
	},
	{ timestamps: true, versionKey: false}
);

UserSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;

