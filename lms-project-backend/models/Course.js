import mongoose from 'mongoose';
import { toSlug } from './helpers.js';

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;
const LessonSchema = new Schema(
	{
		title: { type: String, required: true, trim: true, maxlength: 180 },
		order: { type: Number, required: true, min: 0 },
		startSeconds: { type: Number, required: true, min: 0, index: true },
		endSeconds: { type: Number, min: 0 },
		moduleTitle: { type: String, default: '', trim: true, maxlength: 120 },
		resources: [
			{
				label: { type: String, trim: true, maxlength: 120 },
				url: { type: String, trim: true, maxlength: 1000 },
				_id: false,
			},
		],
	},
	{ _id: true }
);
const CourseSchema = new Schema(
	{
		title: { type: String, required: true, trim: true, maxlength: 220 },
		slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
		subtitle: { type: String, default: '', trim: true, maxlength: 220 },
		description: { type: String, default: '', maxlength: 20000 },
		summary: { type: String, default: '', maxlength: 8000 },
		tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
		level: {
			type: String,
			enum: ['beginner', 'intermediate', 'advanced', 'expert'],
			default: 'beginner',
		},
		language: { type: String, default: 'en' },
		thumbnailUrl: { type: String, default: '' },
		bannerUrl: { type: String, default: '' },
		 videoUrl: { type: String, required: true },
		 duration: { type: Number, default: 0 },
		
		lessons: { type: [LessonSchema], default: [] },
		publishedAt: { type: Date },
		createdBy: { type: objectId, ref: 'User', required: true, index: true },
		updatedBy: { type: objectId, ref: 'User' },
	},
	{ timestamps: true, versionKey: false}
);


CourseSchema.index({ status: 1, createdAt: -1 });

CourseSchema.pre('validate', function courseSlug(next) {
	if (!this.slug && this.title) this.slug = toSlug(this.title);
	next();
});

const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);

export { LessonSchema };
export default Course;

