import asyncHandler from '../utils/asyncHandler.js';
import * as courseProgressService from '../services/courseProgressService.js';

// ==================== CREATE ENDPOINTS ====================

/**
 * POST /api/course-progress
 * Create a new course progress record
 */
export const createCourseProgress = asyncHandler(async (req, res) => {
	const { courseId, progressData } = req.body;

	if (!courseId) {
		return res.status(400).json({ success: false, message: 'Course ID is required' });
	}

	const data = await courseProgressService.createCourseProgress(
		req.user.id,
		courseId,
		progressData
	);

	res.status(201).json({ success: true, data });
});

/**
 * POST /api/course-progress/bulk
 * Bulk create course progress for multiple users
 */
export const bulkCreateCourseProgress = asyncHandler(async (req, res) => {
	const { courseId, userIds } = req.body;

	if (!courseId || !userIds || !Array.isArray(userIds)) {
		return res
			.status(400)
			.json({ success: false, message: 'Course ID and user IDs array are required' });
	}

	const data = await courseProgressService.bulkCreateCourseProgress(courseId, userIds);

	res.status(201).json({ success: true, data });
});

// ==================== READ ENDPOINTS ====================

/**
 * GET /api/course-progress/:courseId
 * Get course progress by user and course
 */
export const getCourseProgress = asyncHandler(async (req, res) => {
	const { courseId } = req.params;

	const data = await courseProgressService.getCourseProgressByUserCourse(req.user.id, courseId);

	res.json({ success: true, data });
});

/**
 * GET /api/course-progress/id/:progressId
 * Get course progress by ID
 */
export const getCourseProgressById = asyncHandler(async (req, res) => {
	const { progressId } = req.params;

	const data = await courseProgressService.getCourseProgressById(progressId);

	res.json({ success: true, data });
});

/**
 * GET /api/course-progress
 * Get all course progress for a user
 */
export const getUserCourseProgress = asyncHandler(async (req, res) => {
	const { enrollmentStatus, limit = 10, skip = 0 } = req.query;

	const filter = {};
	if (enrollmentStatus) {
		filter.enrollmentStatus = enrollmentStatus;
	}

	const data = await courseProgressService.getUserCourseProgress(
		req.user.id,
		filter,
		parseInt(limit),
		parseInt(skip)
	);

	res.json({ success: true, data });
});

/**
 * GET /api/course-progress/course/:courseId/all
 * Get all progress records for a course (instructor view)
 */
export const getCourseLevelProgress = asyncHandler(async (req, res) => {
	const { courseId } = req.params;
	const { enrollmentStatus, limit = 10, skip = 0 } = req.query;

	const filter = {};
	if (enrollmentStatus) {
		filter.enrollmentStatus = enrollmentStatus;
	}

	const data = await courseProgressService.getCourseLevelProgress(
		courseId,
		filter,
		parseInt(limit),
		parseInt(skip)
	);

	res.json({ success: true, data });
});

/**
 * GET /api/course-progress/:courseId/stats
 * Get course completion statistics
 */
export const getCourseCompletionStats = asyncHandler(async (req, res) => {
	const { courseId } = req.params;

	const data = await courseProgressService.getCourseCompletionStats(courseId);

	res.json({ success: true, data });
});

// ==================== UPDATE ENDPOINTS ====================

/**
 * PATCH /api/course-progress/:progressId
 * Update course progress
 */
export const updateCourseProgress = asyncHandler(async (req, res) => {
	const { progressId } = req.params;

	const data = await courseProgressService.updateCourseProgress(progressId, req.body);

	res.json({ success: true, data });
});

/**
 * PATCH /api/course-progress/:courseId/user
 * Update progress for a specific user-course combination
 */
export const updateUserCourseProgress = asyncHandler(async (req, res) => {
	const { courseId } = req.params;

	const data = await courseProgressService.updateUserCourseProgress(
		req.user.id,
		courseId,
		req.body
	);

	res.json({ success: true, data });
});

/**
 * PATCH /api/course-progress/:courseId/complete
 * Mark course as completed
 */
export const markCourseAsCompleted = asyncHandler(async (req, res) => {
	const { courseId } = req.params;

	const data = await courseProgressService.markCourseAsCompleted(req.user.id, courseId);

	res.json({ success: true, data });
});

/**
 * PATCH /api/course-progress/:courseId/lesson/:lessonId
 * Update lesson progress within a course
 */
export const updateLessonProgress = asyncHandler(async (req, res) => {
	const { courseId, lessonId } = req.params;

	const data = await courseProgressService.updateLessonProgress(
		req.user.id,
		courseId,
		lessonId,
		req.body
	);

	res.json({ success: true, data });
});

/**
 * PATCH /api/course-progress/bulk/completion
 * Bulk update completion percent for multiple progress records
 */
export const bulkUpdateCompletionPercent = asyncHandler(async (req, res) => {
	const { courseId, updates } = req.body;

	if (!courseId || !updates || !Array.isArray(updates)) {
		return res.status(400).json({
			success: false,
			message: 'Course ID and updates array are required',
		});
	}

	const data = await courseProgressService.bulkUpdateCompletionPercent(courseId, updates);

	res.json({ success: true, data });
});

// ==================== DELETE ENDPOINTS ====================

/**
 * DELETE /api/course-progress/:progressId
 * Delete course progress
 */
export const deleteCourseProgress = asyncHandler(async (req, res) => {
	const { progressId } = req.params;

	const data = await courseProgressService.deleteCourseProgress(progressId);

	res.json({ success: true, message: 'Course progress deleted successfully', data });
});

/**
 * DELETE /api/course-progress/:courseId/user
 * Delete user course progress
 */
export const deleteUserCourseProgress = asyncHandler(async (req, res) => {
	const { courseId } = req.params;

	const data = await courseProgressService.deleteUserCourseProgress(req.user.id, courseId);

	res.json({ success: true, message: 'Course progress deleted successfully', data });
});

/**
 * PATCH /api/course-progress/:courseId/reset
 * Reset course progress to initial state
 */
export const resetCourseProgress = asyncHandler(async (req, res) => {
	const { courseId } = req.params;

	const data = await courseProgressService.resetCourseProgress(req.user.id, courseId);

	res.json({ success: true, message: 'Course progress reset successfully', data });
});
