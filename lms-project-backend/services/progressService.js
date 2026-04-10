import AppError from '../utils/AppError.js';
import { CourseProgress } from '../models/index.js';

export async function getCourseProgress(userId, courseId) {
  const progress = await CourseProgress.findOne({ user: userId, course: courseId });
  if (!progress) {
    return {
      user: userId,
      course: courseId,
      enrollmentStatus: 'enrolled',
      enrolledAt: new Date(),
      lastWatchedSecond: 0,
      completedLessonIds: [],
      completionPercent: 0,
      quizGates: [],
    };
  }

  return progress;
}

export async function updateWatchProgress(userId, courseId, payload) {
  const update = {
    lastWatchedSecond: Number(payload.lastWatchedSecond || 0),
    completionPercent: Number(payload.completionPercent || 0),
    lastLessonId: payload.lastLessonId || undefined,
  };

  if (update.completionPercent < 0 || update.completionPercent > 100) {
    throw new AppError('completionPercent must be between 0 and 100', 400);
  }

  const progress = await CourseProgress.findOneAndUpdate(
    { user: userId, course: courseId },
    {
      $setOnInsert: {
        user: userId,
        course: courseId,
        enrollmentStatus: 'enrolled',
      },
      $set: update,
    },
    { upsert: true, new: true }
  );

  return progress;
}
