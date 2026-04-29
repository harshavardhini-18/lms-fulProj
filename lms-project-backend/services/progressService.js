import AppError from '../utils/AppError.js';
import { CourseProgress, Module } from '../models/index.js';

export async function getCourseProgress(userId, courseId) {
  let progress = await CourseProgress.findOne({ user: userId, course: courseId })
    .populate('currentModule')
    .populate('currentLesson');

  if (!progress) {
    // Create new progress if doesn't exist
    progress = await CourseProgress.create({
      user: userId,
      course: courseId,
      enrollmentStatus: 'enrolled',
      enrolledAt: new Date(),
      lastWatchedTime: 0,
      completedLessonIds: [],
      completionPercent: 0,
      lessonProgress: [],
    });
  }

  return progress;
}

// Update watched time for current lesson
export async function updateLessonWatchProgress(userId, courseId, moduleId, lessonId, payload) {
  if (!payload.lastWatchedTime && payload.lastWatchedTime !== 0) {
    throw new AppError('lastWatchedTime is required', 400);
  }

  const lastWatchedTime = Number(payload.lastWatchedTime);
  if (lastWatchedTime < 0) {
    throw new AppError('lastWatchedTime must be >= 0', 400);
  }

  const progress = await CourseProgress.findOneAndUpdate(
    { user: userId, course: courseId },
    {
      $setOnInsert: {
        user: userId,
        course: courseId,
        enrollmentStatus: 'enrolled',
      },
      $set: {
        currentModule: moduleId,
        currentLesson: lessonId,
        lastWatchedTime,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return progress;
}

// Mark lesson as completed
export async function completeLessonProgress(userId, courseId, moduleId, lessonId) {
  const progress = await CourseProgress.findOne({ user: userId, course: courseId });
  
  if (!progress) {
    throw new AppError('Course progress not found', 404);
  }

  // Upsert lesson progress
  const lessonProgressIndex = progress.lessonProgress.findIndex(
    lp => lp.lesson.toString() === lessonId
  );

  if (lessonProgressIndex === -1) {
    progress.lessonProgress.push({
      lesson: lessonId,
      module: moduleId,
      isCompleted: true,
      completedAt: new Date(),
      lastWatchedTime: 0,
    });
  } else {
    progress.lessonProgress[lessonProgressIndex].isCompleted = true;
    progress.lessonProgress[lessonProgressIndex].completedAt = new Date();
  }

  // Add to completedLessonIds if not already there
  if (!progress.completedLessonIds.includes(lessonId)) {
    progress.completedLessonIds.push(lessonId);
  }

  // Calculate completion percentage
  const module = await Module.findById(moduleId);
  const totalLessons = module?.lessons?.length || 0;
  const completedCount = progress.completedLessonIds.length;
  const completionPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  progress.completionPercent = completionPercent;
  await progress.save();

  return progress;
}

// Mark quiz attempt for a lesson
export async function recordLessonQuizAttempt(userId, courseId, moduleId, lessonId, quizData) {
  const progress = await CourseProgress.findOne({ user: userId, course: courseId });

  if (!progress) {
    throw new AppError('Course progress not found', 404);
  }

  const lessonProgressIndex = progress.lessonProgress.findIndex(
    lp => lp.lesson.toString() === lessonId
  );

  if (lessonProgressIndex === -1) {
    progress.lessonProgress.push({
      lesson: lessonId,
      module: moduleId,
      quizAttempt: {
        quizId: quizData.quizId,
        isPassed: quizData.isPassed || false,
        scorePercent: quizData.scorePercent || 0,
        attemptsUsed: 1,
        lastAttemptAt: new Date(),
      },
    });
  } else {
    const lp = progress.lessonProgress[lessonProgressIndex];
    lp.quizAttempt = {
      quizId: quizData.quizId,
      isPassed: quizData.isPassed || lp.quizAttempt?.isPassed || false,
      scorePercent: quizData.scorePercent || 0,
      attemptsUsed: (lp.quizAttempt?.attemptsUsed || 0) + 1,
      lastAttemptAt: new Date(),
    };
  }

  await progress.save();
  return progress;
}

export async function updateWatchProgress(userId, courseId, payload) {
  const update = {
    lastWatchedTime: Number(payload.lastWatchedTime || 0),
    completionPercent: Number(payload.completionPercent || 0),
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
