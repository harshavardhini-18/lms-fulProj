import mongoose from 'mongoose';

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;

const LessonProgressSchema = new Schema(
	{
		lesson: { type: objectId, required: true },
		module: { type: objectId, required: true },
		lastWatchedTime: { type: Number, min: 0, default: 0 }, // in seconds
		isCompleted: { type: Boolean, default: false },
		completedAt: { type: Date },
		quizAttempt: {
			quizId: { type: objectId, ref: 'Quiz' },
			isPassed: { type: Boolean, default: false },
			scorePercent: { type: Number, min: 0, max: 100, default: 0 },
			attemptsUsed: { type: Number, min: 0, default: 0 },
			lastAttemptAt: { type: Date },
		},
	},
	{ _id: true, timestamps: true }
);

const TimestampGateStateSchema = new Schema(
	{
		quiz: { type: objectId, ref: 'Quiz', required: true },
		triggerTimestampSeconds: { type: Number, required: true, min: 0 },
		isUnlocked: { type: Boolean, default: false },
		isPassed: { type: Boolean, default: false },
		latestScorePercent: { type: Number, min: 0, max: 100, default: 0 },
		attemptsUsed: { type: Number, min: 0, default: 0 },
		lastAttemptAt: { type: Date },
	},
	{ _id: false }
);

const CourseProgressSchema = new Schema(
	{
		user: { type: objectId, ref: 'User', required: true, index: true },
		course: { type: objectId, ref: 'Course', required: true, index: true },
		enrollmentStatus: {
			type: String,
			enum: ['enrolled', 'completed', 'dropped'],
			default: 'enrolled',
			index: true,
		},
		enrolledAt: { type: Date, default: Date.now },
		completedAt: { type: Date },
		currentModule: { type: objectId, ref: 'Module' },
		currentLesson: { type: objectId, ref: 'Lesson' },
		lastWatchedTime: { type: Number, min: 0, default: 0 }, // last watched time in seconds
		lessonProgress: { type: [LessonProgressSchema], default: [] },
		completedLessonIds: [{ type: objectId }],
		completionPercent: { type: Number, min: 0, max: 100, default: 0 },
		quizGates: { type: [TimestampGateStateSchema], default: [] },
	},
	{ timestamps: true, versionKey: false }
);

CourseProgressSchema.index({ user: 1, course: 1 }, { unique: true });
CourseProgressSchema.index({ course: 1, completionPercent: -1 });

const CourseProgress =
	mongoose.models.CourseProgress || mongoose.model('CourseProgress', CourseProgressSchema);

export { TimestampGateStateSchema, LessonProgressSchema };
export default CourseProgress;

