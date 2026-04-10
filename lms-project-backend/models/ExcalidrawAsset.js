import mongoose from 'mongoose';

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;

const ExcalidrawAssetSchema = new Schema(
	{
		ownerUser: { type: objectId, ref: 'User', required: true, index: true },
		course: { type: objectId, ref: 'Course', required: true, index: true },
		note: { type: objectId, ref: 'Note', index: true },
		excalidrawFileId: { type: String, required: true, trim: true, index: true },
		originalName: { type: String, default: '', maxlength: 255 },
		mimeType: { type: String, required: true, maxlength: 120 },
		sizeBytes: { type: Number, required: true, min: 0 },
		width: { type: Number, min: 0 },
		height: { type: Number, min: 0 },
		sha256: { type: String, required: true, index: true },
		storage: {
			provider: { type: String, enum: ['gridfs', 's3', 'cloudinary', 'other'], required: true },
			gridFsFileId: { type: objectId },
			bucket: { type: String, default: '' },
			key: { type: String, default: '' },
			url: { type: String, default: '' },
		},
		isDeleted: { type: Boolean, default: false, index: true },
	},
	{ timestamps: true, versionKey: false }
);

ExcalidrawAssetSchema.index(
	{ ownerUser: 1, sha256: 1, excalidrawFileId: 1 },
	{ unique: true, partialFilterExpression: { isDeleted: false } }
);

const ExcalidrawAsset =
	mongoose.models.ExcalidrawAsset || mongoose.model('ExcalidrawAsset', ExcalidrawAssetSchema);

export default ExcalidrawAsset;

