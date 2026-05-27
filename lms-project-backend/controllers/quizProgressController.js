import asyncHandler from '../utils/asyncHandler.js';
import * as quizProgressService from '../services/quizProgressService.js';

// ==================== CREATE ENDPOINTS ====================

/**
 * POST /api/quiz-progress
 * Create a new quiz progress record
 */
export const createQuizProgress = asyncHandler(async (req, res) => {
	const { courseId, quizId, progressData } = req.body;

	if (!courseId || !quizId) {
		return res.status(400).json({
			success: false,
			message: 'Course ID and Quiz ID are required',
		});
	}

	const data = await quizProgressService.createQuizProgress(
		req.user.id,
		courseId,
		quizId,
		progressData
	);

	res.status(201).json({ success: true, data });
});

/**
 * POST /api/quiz-progress/bulk
 * Bulk create quiz progress for multiple users
 */
export const bulkCreateQuizProgress = asyncHandler(async (req, res) => {
	const { courseId, quizId, userIds } = req.body;

	if (!courseId || !quizId || !userIds || !Array.isArray(userIds)) {
		return res.status(400).json({
			success: false,
			message: 'Course ID, Quiz ID, and user IDs array are required',
		});
	}

	const data = await quizProgressService.bulkCreateQuizProgress(courseId, quizId, userIds);

	res.status(201).json({ success: true, data });
});

// ==================== READ ENDPOINTS ====================

/**
 * GET /api/quiz-progress/:quizId
 * Get quiz progress by user and quiz
 */
export const getQuizProgress = asyncHandler(async (req, res) => {
	const { quizId } = req.params;

	const data = await quizProgressService.getQuizProgressByUserQuiz(req.user.id, quizId);

	res.json({ success: true, data });
});

/**
 * GET /api/quiz-progress/id/:progressId
 * Get quiz progress by ID
 */
export const getQuizProgressById = asyncHandler(async (req, res) => {
	const { progressId } = req.params;

	const data = await quizProgressService.getQuizProgressById(progressId);

	res.json({ success: true, data });
});

/**
 * GET /api/quiz-progress
 * Get all quiz progress for a user
 */
export const getUserQuizProgress = asyncHandler(async (req, res) => {
	const { courseId, enrollmentStatus, isPassed, limit = 10, skip = 0 } = req.query;

	const filter = {};
	if (courseId) {
		filter.courseId = courseId;
	}
	if (enrollmentStatus) {
		filter.enrollmentStatus = enrollmentStatus;
	}
	if (isPassed !== undefined) {
		filter.isPassed = isPassed === 'true';
	}

	const data = await quizProgressService.getUserQuizProgress(
		req.user.id,
		filter,
		parseInt(limit),
		parseInt(skip)
	);

	res.json({ success: true, data });
});

/**
 * GET /api/quiz-progress/quiz/:quizId/all
 * Get all progress records for a quiz (instructor view)
 */
export const getQuizLevelProgress = asyncHandler(async (req, res) => {
	const { quizId } = req.params;
	const { isPassed, limit = 10, skip = 0 } = req.query;

	const filter = {};
	if (isPassed !== undefined) {
		filter.isPassed = isPassed === 'true';
	}

	const data = await quizProgressService.getQuizLevelProgress(
		quizId,
		filter,
		parseInt(limit),
		parseInt(skip)
	);

	res.json({ success: true, data });
});

/**
 * GET /api/quiz-progress/:quizId/stats
 * Get quiz performance statistics
 */
export const getQuizPerformanceStats = asyncHandler(async (req, res) => {
	const { quizId } = req.params;

	const data = await quizProgressService.getQuizPerformanceStats(quizId);

	res.json({ success: true, data });
});

/**
 * GET /api/quiz-progress/course/:courseId/all
 * Get all quiz progress for a course
 */
export const getCourseQuizProgress = asyncHandler(async (req, res) => {
	const { courseId } = req.params;
	const { limit = 10, skip = 0 } = req.query;

	const data = await quizProgressService.getCourseQuizProgress(
		courseId,
		parseInt(limit),
		parseInt(skip)
	);

	res.json({ success: true, data });
});

// ==================== UPDATE ENDPOINTS ====================

/**
 * PATCH /api/quiz-progress/:progressId
 * Update quiz progress
 */
export const updateQuizProgress = asyncHandler(async (req, res) => {
	const { progressId } = req.params;

	const data = await quizProgressService.updateQuizProgress(progressId, req.body);

	res.json({ success: true, data });
});

/**
 * PATCH /api/quiz-progress/:quizId/user
 * Update progress for a specific user-quiz combination
 */
export const updateUserQuizProgress = asyncHandler(async (req, res) => {
	const { quizId } = req.params;

	const data = await quizProgressService.updateUserQuizProgress(req.user.id, quizId, req.body);

	res.json({ success: true, data });
});

/**
 * PATCH /api/quiz-progress/:quizId/attempt
 * Update quiz progress after an attempt
 */
export const updateProgressWithAttempt = asyncHandler(async (req, res) => {
	const { quizId } = req.params;
	const { score, totalPoints, duration, attemptId, answers } = req.body;

	if (score === undefined || totalPoints === undefined) {
		return res.status(400).json({
			success: false,
			message: 'Score and totalPoints are required',
		});
	}

	const data = await quizProgressService.updateProgressWithAttempt(req.user.id, quizId, {
		score,
		totalPoints,
		duration,
		attemptId,
		answers,
	});

	res.json({ success: true, data });
});

/**
 * PATCH /api/quiz-progress/:quizId/pass
 * Mark quiz as passed
 */
export const markQuizAsPassed = asyncHandler(async (req, res) => {
	const { quizId } = req.params;

	const data = await quizProgressService.markQuizAsPassed(req.user.id, quizId);

	res.json({ success: true, data });
});

// ==================== DELETE ENDPOINTS ====================

/**
 * DELETE /api/quiz-progress/:progressId
 * Delete quiz progress
 */
export const deleteQuizProgress = asyncHandler(async (req, res) => {
	const { progressId } = req.params;

	const data = await quizProgressService.deleteQuizProgress(progressId);

	res.json({ success: true, message: 'Quiz progress deleted successfully', data });
});

/**
 * DELETE /api/quiz-progress/:quizId/user
 * Delete user quiz progress
 */
export const deleteUserQuizProgress = asyncHandler(async (req, res) => {
	const { quizId } = req.params;

	const data = await quizProgressService.deleteUserQuizProgress(req.user.id, quizId);

	res.json({ success: true, message: 'Quiz progress deleted successfully', data });
});

/**
 * PATCH /api/quiz-progress/:quizId/reset
 * Reset quiz progress to initial state
 */
export const resetQuizProgress = asyncHandler(async (req, res) => {
	const { quizId } = req.params;

	const data = await quizProgressService.resetQuizProgress(req.user.id, quizId);

	res.json({ success: true, message: 'Quiz progress reset successfully', data });
});
