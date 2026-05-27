import CourseProgress from '../models/CourseProgress.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

// ==================== CREATE OPERATIONS ====================

/**
 * Create a new course progress record
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {Object} progressData - Progress data
 * @returns {Object} Created course progress
 */
export const createCourseProgress = async (userId, courseId, progressData = {}) => {
	try {
		// Verify user and course exist
		const [user, course] = await Promise.all([
			User.findById(userId),
			Course.findById(courseId),
		]);

		if (!user) throw new AppError('User not found', 404);
		if (!course) throw new AppError('Course not found', 404);

		// Check if progress already exists
		const existing = await CourseProgress.findOne({ user: userId, course: courseId });
		if (existing) {
			throw new AppError('Course progress already exists for this user', 400);
		}

		const courseProgress = new CourseProgress({
			user: userId,
			course: courseId,
			enrollmentStatus: progressData.enrollmentStatus || 'enrolled',
			enrolledAt: progressData.enrolledAt || new Date(),
			currentModule: progressData.currentModule,
			currentLesson: progressData.currentLesson,
			lastWatchedTime: progressData.lastWatchedTime || 0,
			lessonProgress: progressData.lessonProgress || [],
			completedLessonIds: progressData.completedLessonIds || [],
			completionPercent: progressData.completionPercent || 0,
			quizGates: progressData.quizGates || [],
		});

		const saved = await courseProgress.save();
		return saved.populate(['user', 'course', 'currentModule', 'currentLesson']);
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Bulk create course progress for multiple users
 * @param {string} courseId - Course ID
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Object} Result with created count
 */
export const bulkCreateCourseProgress = async (courseId, userIds) => {
	try {
		const course = await Course.findById(courseId);
		if (!course) throw new AppError('Course not found', 404);

		// Verify all users exist
		const users = await User.find({ _id: { $in: userIds } });
		if (users.length !== userIds.length) {
			throw new AppError('Some users not found', 404);
		}

		const progressRecords = userIds.map((userId) => ({
			user: userId,
			course: courseId,
			enrollmentStatus: 'enrolled',
			enrolledAt: new Date(),
			completionPercent: 0,
		}));

		const result = await CourseProgress.insertMany(progressRecords, { ordered: false });
		return {
			success: true,
			createdCount: result.length,
			records: result,
		};
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

// ==================== READ OPERATIONS ====================

/**
 * Get course progress by user and course
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Object} Course progress record
 */
export const getCourseProgressByUserCourse = async (userId, courseId) => {
	try {
		const progress = await CourseProgress.findOne({ user: userId, course: courseId })
			.populate('user', 'name email')
			.populate('course', 'title description')
			.populate('currentModule')
			.populate('currentLesson');

		if (!progress) {
			throw new AppError('Course progress not found', 404);
		}

		return progress;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 404);
	}
};

/**
 * Get all course progress for a user
 * @param {string} userId - User ID
 * @param {Object} filter - Filter options (enrollmentStatus, etc.)
 * @param {number} limit - Limit results
 * @param {number} skip - Skip results
 * @returns {Object} Array of course progress records and total count
 */
export const getUserCourseProgress = async (userId, filter = {}, limit = 10, skip = 0) => {
	try {
		const query = { user: userId };

		if (filter.enrollmentStatus) {
			query.enrollmentStatus = filter.enrollmentStatus;
		}

		const total = await CourseProgress.countDocuments(query);
		const records = await CourseProgress.find(query)
			.populate('user', 'name email')
			.populate('course', 'title description')
			.limit(limit)
			.skip(skip)
			.sort({ createdAt: -1 });

		return {
			data: records,
			total,
			limit,
			skip,
			pages: Math.ceil(total / limit),
		};
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Get all course progress for a course (for instructors)
 * @param {string} courseId - Course ID
 * @param {Object} filter - Filter options
 * @param {number} limit - Limit results
 * @param {number} skip - Skip results
 * @returns {Object} Array of progress records
 */
export const getCourseLevelProgress = async (courseId, filter = {}, limit = 10, skip = 0) => {
	try {
		const query = { course: courseId };

		if (filter.enrollmentStatus) {
			query.enrollmentStatus = filter.enrollmentStatus;
		}

		const total = await CourseProgress.countDocuments(query);
		const records = await CourseProgress.find(query)
			.populate('user', 'name email')
			.populate('course', 'title')
			.limit(limit)
			.skip(skip)
			.sort({ completionPercent: -1 });

		return {
			data: records,
			total,
			limit,
			skip,
			pages: Math.ceil(total / limit),
		};
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Get progress by ID
 * @param {string} progressId - Course progress ID
 * @returns {Object} Course progress record
 */
export const getCourseProgressById = async (progressId) => {
	try {
		const progress = await CourseProgress.findById(progressId)
			.populate('user', 'name email')
			.populate('course', 'title description')
			.populate('currentModule')
			.populate('currentLesson');

		if (!progress) {
			throw new AppError('Course progress not found', 404);
		}

		return progress;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 404);
	}
};

/**
 * Get course completion statistics
 * @param {string} courseId - Course ID
 * @returns {Object} Statistics object
 */
export const getCourseCompletionStats = async (courseId) => {
	try {
		const stats = await CourseProgress.aggregate([
			{ $match: { course: mongoose.Types.ObjectId(courseId) } },
			{
				$group: {
					_id: null,
					totalEnrolled: { $sum: 1 },
					totalCompleted: {
						$sum: { $cond: [{ $eq: ['$enrollmentStatus', 'completed'] }, 1, 0] },
					},
					totalDropped: {
						$sum: { $cond: [{ $eq: ['$enrollmentStatus', 'dropped'] }, 1, 0] },
					},
					avgCompletion: { $avg: '$completionPercent' },
					maxCompletion: { $max: '$completionPercent' },
					minCompletion: { $min: '$completionPercent' },
				},
			},
		]);

		return stats.length > 0
			? stats[0]
			: {
					totalEnrolled: 0,
					totalCompleted: 0,
					totalDropped: 0,
					avgCompletion: 0,
					maxCompletion: 0,
					minCompletion: 0,
			  };
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

// ==================== UPDATE OPERATIONS ====================

/**
 * Update course progress
 * @param {string} progressId - Course progress ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated course progress
 */
export const updateCourseProgress = async (progressId, updateData) => {
	try {
		const allowedFields = [
			'currentModule',
			'currentLesson',
			'lastWatchedTime',
			'completionPercent',
			'enrollmentStatus',
			'lessonProgress',
			'quizGates',
		];

		const updatePayload = {};
		Object.keys(updateData).forEach((key) => {
			if (allowedFields.includes(key)) {
				updatePayload[key] = updateData[key];
			}
		});

		const progress = await CourseProgress.findByIdAndUpdate(progressId, updatePayload, {
			new: true,
			runValidators: true,
		})
			.populate('user', 'name email')
			.populate('course', 'title');

		if (!progress) {
			throw new AppError('Course progress not found', 404);
		}

		return progress;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Update progress for a specific user-course combination
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated course progress
 */
export const updateUserCourseProgress = async (userId, courseId, updateData) => {
	try {
		const allowedFields = [
			'currentModule',
			'currentLesson',
			'lastWatchedTime',
			'completionPercent',
			'enrollmentStatus',
			'lessonProgress',
			'quizGates',
		];

		const updatePayload = {};
		Object.keys(updateData).forEach((key) => {
			if (allowedFields.includes(key)) {
				updatePayload[key] = updateData[key];
			}
		});

		const progress = await CourseProgress.findOneAndUpdate(
			{ user: userId, course: courseId },
			updatePayload,
			{ new: true, runValidators: true }
		)
			.populate('user', 'name email')
			.populate('course', 'title');

		if (!progress) {
			throw new AppError('Course progress not found', 404);
		}

		return progress;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Mark course as completed
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Object} Updated course progress
 */
export const markCourseAsCompleted = async (userId, courseId) => {
	try {
		const progress = await CourseProgress.findOneAndUpdate(
			{ user: userId, course: courseId },
			{
				enrollmentStatus: 'completed',
				completionPercent: 100,
				completedAt: new Date(),
			},
			{ new: true, runValidators: true }
		);

		if (!progress) {
			throw new AppError('Course progress not found', 404);
		}

		return progress;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Update lesson progress
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {string} lessonId - Lesson ID
 * @param {Object} lessonData - Lesson progress data
 * @returns {Object} Updated course progress
 */
export const updateLessonProgress = async (userId, courseId, lessonId, lessonData) => {
	try {
		const progress = await CourseProgress.findOne({ user: userId, course: courseId });

		if (!progress) {
			throw new AppError('Course progress not found', 404);
		}

		// Find existing lesson progress
		const existingIndex = progress.lessonProgress.findIndex(
			(lp) => lp.lesson.toString() === lessonId
		);

		if (existingIndex !== -1) {
			// Update existing
			progress.lessonProgress[existingIndex] = {
				...progress.lessonProgress[existingIndex].toObject(),
				...lessonData,
			};
		} else {
			// Add new
			progress.lessonProgress.push(lessonData);
		}

		const updated = await progress.save();
		return updated.populate('user', 'name email');
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Bulk update completion percent for multiple progress records
 * @param {string} courseId - Course ID
 * @param {Array<Object>} updates - Array of {userId, completionPercent}
 * @returns {Object} Update result
 */
export const bulkUpdateCompletionPercent = async (courseId, updates) => {
	try {
		const operations = updates.map((update) => ({
			updateOne: {
				filter: { user: update.userId, course: courseId },
				update: { $set: { completionPercent: update.completionPercent } },
			},
		}));

		const result = await CourseProgress.bulkWrite(operations);

		return {
			success: true,
			modifiedCount: result.modifiedCount,
			matchedCount: result.matchedCount,
		};
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

// ==================== DELETE/CLEANUP OPERATIONS ====================

/**
 * Delete course progress
 * @param {string} progressId - Course progress ID
 * @returns {Object} Deleted progress
 */
export const deleteCourseProgress = async (progressId) => {
	try {
		const deleted = await CourseProgress.findByIdAndDelete(progressId);

		if (!deleted) {
			throw new AppError('Course progress not found', 404);
		}

		return deleted;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Delete user course progress
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Object} Deleted progress
 */
export const deleteUserCourseProgress = async (userId, courseId) => {
	try {
		const deleted = await CourseProgress.findOneAndDelete({ user: userId, course: courseId });

		if (!deleted) {
			throw new AppError('Course progress not found', 404);
		}

		return deleted;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Reset course progress to initial state
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Object} Reset progress
 */
export const resetCourseProgress = async (userId, courseId) => {
	try {
		const reset = await CourseProgress.findOneAndUpdate(
			{ user: userId, course: courseId },
			{
				enrollmentStatus: 'enrolled',
				currentModule: null,
				currentLesson: null,
				lastWatchedTime: 0,
				lessonProgress: [],
				completedLessonIds: [],
				completionPercent: 0,
				quizGates: [],
				completedAt: null,
			},
			{ new: true, runValidators: true }
		);

		if (!reset) {
			throw new AppError('Course progress not found', 404);
		}

		return reset;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};
