import mongoose from 'mongoose';

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;

const QuizChoiceSchema = new Schema(
	{
		optionKey: { type: String, required: true, trim: true, maxlength: 20 },
		text: { type: String, required: true, trim: true, maxlength: 1000 },
		isCorrect: { type: Boolean, default: false },
		explanation: { type: String, default: '', maxlength: 2000 },
	},
	{ _id: true }
);
const QuizQuestionSchema = new Schema(
	{
		order: { type: Number, required: true, min: 0 },
		type: {
			type: String,
			enum: ['single_choice', 'multi_choice', 'true_false', 'short_text'],
			default: 'single_choice',
			index: true,
		},
		prompt: { type: String, required: true, trim: true, maxlength: 4000 },
		points: { type: Number, min: 0, default: 1 },
		choices: { type: [QuizChoiceSchema], default: [] },
		acceptedAnswers: [{ type: String, trim: true, lowercase: true, maxlength: 300 }],
	},
	{ _id: true }
);
const QuizSchema = new Schema(
	{
		course: { type: objectId, ref: 'Course', required: true, index: true },
		triggerTimestampSeconds: { type: Number, required: true, min: 0, index: true },
		title: { type: String, required: true, trim: true, maxlength: 180 },
		description: { type: String, default: '', maxlength: 3000 },
		questions: { type: [QuizQuestionSchema], default: [] },
		passingScorePercent: { type: Number, min: 0, max: 100, default: 70 },
		attemptsAllowed: { type: Number, min: 1, default: 3 },
		timeLimitSeconds: { type: Number, min: 0, default: 0 },
		isMandatory: { type: Boolean, default: true },
	},
	{ timestamps: true, versionKey: false }
);

QuizSchema.index(
	{ course: 1, triggerTimestampSeconds: 1, status: 1 },
	{ unique: true, partialFilterExpression: { status: { $in: ['active', 'inactive'] } } }
);

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);

export { QuizChoiceSchema, QuizQuestionSchema };
export default Quiz;

