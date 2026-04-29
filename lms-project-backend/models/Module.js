import mongoose from 'mongoose';
import { toSlug } from './helpers.js';

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;

const LessonSchema = new Schema(
	{
		title: { type: String, required: true, trim: true, maxlength: 180 },
		order: { type: Number, required: true, min: 0 },
		contentType: {
			type: String,
			enum: ['video', 'text', 'quiz', 'assignment'],
			default: 'video',
		},
		videoUrl: { type: String, default: '', trim: true, maxlength: 1000 },
		videoDuration: { type: Number, default: 0, min: 0 }, // duration in seconds
		textContent: { type: String, default: '', maxlength: 50000 },
		description: { type: String, default: '', maxlength: 2000 },
		resources: [
			{
				label: { type: String, trim: true, maxlength: 120 },
				url: { type: String, trim: true, maxlength: 1000 },
				_id: false,
			},
		],
		// Quiz
		quizId: { type: objectId, ref: 'Quiz' },
		// Assignment
		assignmentDetails: {
			instructions: { type: String, default: '', maxlength: 2000 },
			dueDate: { type: Date },
			_id: false,
		},
		// Notes feature
		notesEnabled: { type: Boolean, default: true },
		// Timestamp control
		timestampStart: { type: Number, default: 0, min: 0 },
		timestampEnd: { type: Number, default: 0, min: 0 },
		timestampNotesEnabled: { type: Boolean, default: false },
		// Lock/Unlock
		isFreePreview: { type: Boolean, default: false },
		lockedUntilPreviousCompleted: { type: Boolean, default: false },
	},
	{ _id: true, timestamps: true }
);

const ModuleSchema = new Schema(
	{
		course: { type: objectId, ref: 'Course', required: true, index: true },
		title: { type: String, required: true, trim: true, maxlength: 180 },
		slug: { type: String, required: true, trim: true, lowercase: true },
		description: { type: String, default: '', maxlength: 2000 },
		order: { type: Number, required: true, min: 0 },
		lessons: { type: [LessonSchema], default: [] },
	},
	{ timestamps: true, versionKey: false }
);

ModuleSchema.index({ course: 1, order: 1 });
ModuleSchema.index({ slug: 1, course: 1 }, { unique: true });

ModuleSchema.pre('save', async function() {
	if (!this.slug && this.title) this.slug = toSlug(this.title);
});

const Module = mongoose.models.Module || mongoose.model('Module', ModuleSchema);

export { LessonSchema };
export default Module;
