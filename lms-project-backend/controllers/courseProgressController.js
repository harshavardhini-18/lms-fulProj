import asyncHandler from '../utils/asyncHandler.js';
import {
  deleteStudentCourseProgress,
  deleteStudentLessonProgress,
  getQuizAttemptAnswerRows,
  getStudentCourseProgress,
  markLessonContentComplete,
} from '../services/courseProgressPgService.js';

export const getByCourse = asyncHandler(async (req, res) => {
  const data = await getStudentCourseProgress(req.user.id, req.params.courseId);
  res.json({ success: true, data });
});

export const completeLesson = asyncHandler(async (req, res) => {
  const { courseId, moduleId, lessonId } = req.params;
  const watchSeconds = Number(req.body?.watchSeconds ?? req.body?.watchedSeconds ?? 0);
  const data = await markLessonContentComplete(
    req.user.id,
    courseId,
    moduleId,
    lessonId,
    watchSeconds
  );
  res.json({ success: true, data });
});

export const getAttemptAnswers = asyncHandler(async (req, res) => {
  const rows = await getQuizAttemptAnswerRows(req.params.attemptId, req.user.id);
  res.json({
    success: true,
    data: rows.map((r) => ({
      questionId: r.question_id,
      position: r.position,
      questionType: r.question_type,
      studentAnswer: r.student_answer,
      correctAnswer: r.correct_answer,
      studentAnswerLabel: r.student_answer_label,
      correctAnswerLabel: r.correct_answer_label,
      isCorrect: r.is_correct,
      isSkipped: r.is_skipped,
      pointsEarned: Number(r.points_earned),
      pointsMax: Number(r.points_max),
      quizId: r.quiz_id,
      courseId: r.course_id,
      subtopicId: r.subtopic_id,
      scoreEarned: Number(r.score_earned),
      maxPoints: Number(r.max_points),
      scorePercent: r.score_percent,
    })),
  });
});

export const deleteCourseProgress = asyncHandler(async (req, res) => {
  const data = await deleteStudentCourseProgress(req.user.id, req.params.courseId);
  res.json({ success: true, data });
});

export const deleteLessonProgress = asyncHandler(async (req, res) => {
  const data = await deleteStudentLessonProgress(
    req.user.id,
    req.params.courseId,
    req.params.lessonId
  );
  res.json({ success: true, data });
});
