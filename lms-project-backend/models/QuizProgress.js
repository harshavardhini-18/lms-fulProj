import mongoose from 'mongoose';

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;

const QuizProgressSchema = new Schema(
	{
		user: { type: objectId, ref: 'User', required: true, index: true },
		course: { type: objectId, ref: 'Course', required: true, index: true },
		quiz: { type: objectId, ref: 'Quiz', required: true, index: true },
		enrollmentStatus: {
			type: String,
			enum: ['not_started', 'in_progress', 'passed', 'failed'],
			default: 'not_started',
			index: true,
		},
		totalAttempts: { type: Number, min: 0, default: 0 },
		attemptsPassed: { type: Number, min: 0, default: 0 },
		attemptsFailed: { type: Number, min: 0, default: 0 },
		bestScore: { type: Number, min: 0, max: 100, default: 0 },
		latestScore: { type: Number, min: 0, max: 100, default: 0 },
		isPassed: { type: Boolean, default: false },
		passingScorePercent: { type: Number, min: 0, max: 100, default: 70 },
		firstAttemptAt: { type: Date },
		lastAttemptAt: { type: Date },
		passedAt: { type: Date },
		totalTimeSpent: { type: Number, min: 0, default: 0 }, // in seconds
		lastAttemptDuration: { type: Number, min: 0, default: 0 }, // in seconds
		lastAttemptId: { type: objectId, ref: 'QuizAttempt' },
		latestAttemptAnswers: { type: Array, default: [] },
		notes: { type: String, default: '', maxlength: 2000 },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true, versionKey: false }
);

// Compound unique index - one progress record per user-quiz combination
QuizProgressSchema.index({ user: 1, quiz: 1 }, { unique: true });
QuizProgressSchema.index({ user: 1, course: 1, isPassed: 1 });
QuizProgressSchema.index({ course: 1, isPassed: 1 });
QuizProgressSchema.index({ lastAttemptAt: -1 });

const QuizProgress = mongoose.models.QuizProgress || mongoose.model('QuizProgress', QuizProgressSchema);

export default QuizProgress;
