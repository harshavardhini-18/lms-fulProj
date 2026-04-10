import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import { Course, CourseProgress, ExcalidrawAsset, Note } from '../models/index.js';

function validateDrawingAssets(drawingAssets = []) {
  for (const assetId of drawingAssets) {
    if (!mongoose.Types.ObjectId.isValid(assetId)) {
      throw new AppError(`Invalid drawing asset id: ${assetId}`, 400);
    }
  }
}

export async function listNotesByCourse(userId, courseId) {
  return Note.find({ user: userId, course: courseId, isDeleted: false }).sort({ updatedAt: -1 });
}

export async function createNoteWithAssetsAndProgress(userId, payload) {
  validateDrawingAssets(payload.drawingAssets || []);

  const course = await Course.findById(payload.course).lean();
  if (!course) throw new AppError('Course not found', 404);

  const session = await mongoose.startSession();

  try {
    let noteDoc;

    await session.withTransaction(async () => {
      const [note] = await Note.create(
        [
          {
            ...payload,
            user: userId,
            lastSavedAt: new Date(),
          },
        ],
        { session }
      );

      if ((payload.drawingAssets || []).length > 0) {
        await ExcalidrawAsset.updateMany(
          {
            _id: { $in: payload.drawingAssets },
            ownerUser: userId,
            course: payload.course,
            isDeleted: false,
          },
          {
            $set: { note: note._id },
          },
          { session }
        );
      }

      await CourseProgress.findOneAndUpdate(
        { user: userId, course: payload.course },
        {
          $setOnInsert: { user: userId, course: payload.course },
          $set: {
            lastWatchedSecond: Number(payload.anchorTimestampSeconds || 0),
          },
        },
        { upsert: true, new: true, session }
      );

      noteDoc = note;
    });

    return noteDoc;
  } finally {
    await session.endSession();
  }
}

export async function updateNoteWithAssetsAndProgress(userId, noteId, payload) {
  validateDrawingAssets(payload.drawingAssets || []);

  const existing = await Note.findOne({ _id: noteId, user: userId, isDeleted: false });
  if (!existing) throw new AppError('Note not found', 404);

  const session = await mongoose.startSession();

  try {
    let updated;

    await session.withTransaction(async () => {
      updated = await Note.findOneAndUpdate(
        { _id: noteId, user: userId },
        {
          $set: {
            ...payload,
            lastSavedAt: new Date(),
          },
        },
        { new: true, session }
      );

      if (payload.drawingAssets) {
        await ExcalidrawAsset.updateMany(
          {
            _id: { $in: payload.drawingAssets },
            ownerUser: userId,
            course: existing.course,
            isDeleted: false,
          },
          {
            $set: { note: existing._id },
          },
          { session }
        );
      }

      await CourseProgress.findOneAndUpdate(
        { user: userId, course: existing.course },
        {
          $setOnInsert: { user: userId, course: existing.course },
          $set: {
            lastWatchedSecond:
              payload.anchorTimestampSeconds !== undefined
                ? Number(payload.anchorTimestampSeconds)
                : Number(existing.anchorTimestampSeconds || 0),
          },
        },
        { upsert: true, new: true, session }
      );
    });

    return updated;
  } finally {
    await session.endSession();
  }
}
