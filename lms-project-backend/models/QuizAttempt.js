import mongoose from 'mongoose';

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;

const QuizAttemptAnswerSchema = new Schema(
	{
		questionId: { type: objectId, required: true },
		selectedOptionKeys: [{ type: String, trim: true, maxlength: 20 }],
		textAnswer: { type: String, trim: true, maxlength: 4000 },
		isCorrect: { type: Boolean, default: false },
		pointsAwarded: { type: Number, min: 0, default: 0 },
	},
	{ _id: false }
);

const QuizAttemptSchema = new Schema(
	{
		user: { type: objectId, ref: 'User', required: true, index: true },
		course: { type: objectId, ref: 'Course', required: true, index: true },
		quiz: { type: objectId, ref: 'Quiz', required: true, index: true },
		attemptNumber: { type: Number, required: true, min: 1 },
		startedAt: { type: Date, default: Date.now },
		submittedAt: { type: Date },
		durationSeconds: { type: Number, min: 0, default: 0 },
		status: {
			type: String,
			enum: ['in_progress', 'submitted', 'expired'],
			default: 'in_progress',
			index: true,
		},
		answers: { type: [QuizAttemptAnswerSchema], default: [] },
		score: { type: Number, min: 0, default: 0 },
		totalPoints: { type: Number, min: 0, default: 0 },
		scorePercent: { type: Number, min: 0, max: 100, default: 0 },
		passed: { type: Boolean, default: false },
		quizTitleSnapshot: { type: String, default: '' },
		triggerTimestampSnapshot: { type: Number, min: 0, default: 0 },
	},
	{ timestamps: true, versionKey: false }
);

QuizAttemptSchema.index({ user: 1, quiz: 1, attemptNumber: 1 }, { unique: true });
QuizAttemptSchema.index({ user: 1, course: 1, createdAt: -1 });

const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', QuizAttemptSchema);

export { QuizAttemptAnswerSchema };
export default QuizAttempt;

