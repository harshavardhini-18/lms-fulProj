import mongoose from 'mongoose';

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;

const NoteSchema = new Schema(
	{
		user: { type: objectId, ref: 'User', required: true, index: true },
		course: { type: objectId, ref: 'Course', required: true, index: true },
		lessonId: { type: objectId, index: true },
		anchorTimestampSeconds: { type: Number, min: 0, default: 0, index: true },
		title: { type: String, required: true, trim: true, maxlength: 180 },
		textContent: { type: String, default: '', maxlength: 50000 },
		drawingScene: {
			type: Schema.Types.Mixed,
			default: {
				elements: [],
				appState: { viewBackgroundColor: '#ffffff' },
				files: {},
			},
		},
		drawingAssets: [{ type: objectId, ref: 'ExcalidrawAsset' }],
		createdAtClient: { type: Date },
		lastSavedAt: { type: Date, default: Date.now, index: true },
		isPinned: { type: Boolean, default: false, index: true },
		isArchived: { type: Boolean, default: false, index: true },
		isDeleted: { type: Boolean, default: false, index: true },
	},
	{ timestamps: true, versionKey: false}
);

NoteSchema.index({ user: 1, course: 1, isDeleted: 1, updatedAt: -1 });
NoteSchema.index({ course: 1, lessonId: 1, anchorTimestampSeconds: 1 });

const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

export default Note;

