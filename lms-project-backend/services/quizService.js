import AppError from '../utils/AppError.js';
import { Course, Quiz } from '../models/index.js';

function sanitizeQuiz(quizDoc) {
  const quiz = quizDoc.toObject ? quizDoc.toObject() : structuredClone(quizDoc);
  quiz.questions = (quiz.questions || []).map((question) => ({
    ...question,
    choices: (question.choices || []).map(({ isCorrect, ...choice }) => choice),
  }));
  return quiz;
}

export async function createQuiz(payload, userId) {
  const course = await Course.findById(payload.course).lean();
  if (!course) throw new AppError('Course not found', 404);

  const quiz = await Quiz.create({
    ...payload,
    createdBy: userId,
    updatedBy: userId,
  });

  return sanitizeQuiz(quiz);
}

export async function listQuizzesByCourse(courseId, includeAnswers = false) {
  const quizzes = await Quiz.find({
    course: courseId,
    status: { $in: ['active', 'inactive'] },
  }).sort({ triggerTimestampSeconds: 1, createdAt: 1 });

  if (includeAnswers) return quizzes;
  return quizzes.map((quiz) => sanitizeQuiz(quiz));
}

export async function getQuizByCourseAndTimestamp(courseId, triggerTimestampSeconds, includeAnswers = false) {
  const quiz = await Quiz.findOne({
    course: courseId,
    triggerTimestampSeconds,
    status: { $in: ['active', 'inactive'] },
  });

  if (!quiz) throw new AppError('Quiz not found for this timestamp', 404);

  return includeAnswers ? quiz : sanitizeQuiz(quiz);
}
