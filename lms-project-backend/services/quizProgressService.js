import QuizProgress from '../models/QuizProgress.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import AppError from '../utils/AppError.js';
import mongoose from 'mongoose';

// ==================== CREATE OPERATIONS ====================

/**
 * Create a new quiz progress record
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {string} quizId - Quiz ID
 * @param {Object} progressData - Progress data
 * @returns {Object} Created quiz progress
 */
export const createQuizProgress = async (userId, courseId, quizId, progressData = {}) => {
	try {
		// Verify user, course, and quiz exist
		const [user, course, quiz] = await Promise.all([
			User.findById(userId),
			Course.findById(courseId),
			Quiz.findById(quizId),
		]);

		if (!user) throw new AppError('User not found', 404);
		if (!course) throw new AppError('Course not found', 404);
		if (!quiz) throw new AppError('Quiz not found', 404);

		// Check if progress already exists
		const existing = await QuizProgress.findOne({ user: userId, quiz: quizId });
		if (existing) {
			throw new AppError('Quiz progress already exists for this user', 400);
		}

		const quizProgress = new QuizProgress({
			user: userId,
			course: courseId,
			quiz: quizId,
			enrollmentStatus: progressData.enrollmentStatus || 'not_started',
			totalAttempts: progressData.totalAttempts || 0,
			attemptsPassed: progressData.attemptsPassed || 0,
			attemptsFailed: progressData.attemptsFailed || 0,
			bestScore: progressData.bestScore || 0,
			latestScore: progressData.latestScore || 0,
			isPassed: progressData.isPassed || false,
			passingScorePercent: progressData.passingScorePercent || quiz.passingScorePercent || 70,
			totalTimeSpent: progressData.totalTimeSpent || 0,
			notes: progressData.notes || '',
			isActive: progressData.isActive !== false,
		});

		const saved = await quizProgress.save();
		return saved.populate(['user', 'course', 'quiz']);
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Bulk create quiz progress for users
 * @param {string} courseId - Course ID
 * @param {string} quizId - Quiz ID
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Object} Result with created count
 */
export const bulkCreateQuizProgress = async (courseId, quizId, userIds) => {
	try {
		const [course, quiz] = await Promise.all([
			Course.findById(courseId),
			Quiz.findById(quizId),
		]);

		if (!course) throw new AppError('Course not found', 404);
		if (!quiz) throw new AppError('Quiz not found', 404);

		const users = await User.find({ _id: { $in: userIds } });
		if (users.length !== userIds.length) {
			throw new AppError('Some users not found', 404);
		}

		const progressRecords = userIds.map((userId) => ({
			user: userId,
			course: courseId,
			quiz: quizId,
			enrollmentStatus: 'not_started',
			passingScorePercent: quiz.passingScorePercent || 70,
			isActive: true,
		}));

		const result = await QuizProgress.insertMany(progressRecords, { ordered: false });
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
 * Get quiz progress by user and quiz
 * @param {string} userId - User ID
 * @param {string} quizId - Quiz ID
 * @returns {Object} Quiz progress record
 */
export const getQuizProgressByUserQuiz = async (userId, quizId) => {
	try {
		const progress = await QuizProgress.findOne({ user: userId, quiz: quizId })
			.populate('user', 'name email')
			.populate('course', 'title')
			.populate('quiz', 'title description passingScorePercent')
			.populate('lastAttemptId');

		if (!progress) {
			throw new AppError('Quiz progress not found', 404);
		}

		return progress;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 404);
	}
};

/**
 * Get all quiz progress for a user
 * @param {string} userId - User ID
 * @param {Object} filter - Filter options
 * @param {number} limit - Limit results
 * @param {number} skip - Skip results
 * @returns {Object} Array of quiz progress records and total count
 */
export const getUserQuizProgress = async (userId, filter = {}, limit = 10, skip = 0) => {
	try {
		const query = { user: userId };

		if (filter.courseId) {
			query.course = filter.courseId;
		}

		if (filter.enrollmentStatus) {
			query.enrollmentStatus = filter.enrollmentStatus;
		}

		if (filter.isPassed !== undefined) {
			query.isPassed = filter.isPassed;
		}

		const total = await QuizProgress.countDocuments(query);
		const records = await QuizProgress.find(query)
			.populate('user', 'name email')
			.populate('course', 'title')
			.populate('quiz', 'title')
			.limit(limit)
			.skip(skip)
			.sort({ lastAttemptAt: -1 });

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
 * Get all quiz progress for a quiz (for instructors)
 * @param {string} quizId - Quiz ID
 * @param {Object} filter - Filter options
 * @param {number} limit - Limit results
 * @param {number} skip - Skip results
 * @returns {Object} Array of progress records
 */
export const getQuizLevelProgress = async (quizId, filter = {}, limit = 10, skip = 0) => {
	try {
		const query = { quiz: quizId };

		if (filter.isPassed !== undefined) {
			query.isPassed = filter.isPassed;
		}

		const total = await QuizProgress.countDocuments(query);
		const records = await QuizProgress.find(query)
			.populate('user', 'name email')
			.populate('quiz', 'title')
			.limit(limit)
			.skip(skip)
			.sort({ bestScore: -1 });

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
 * Get quiz progress by ID
 * @param {string} progressId - Quiz progress ID
 * @returns {Object} Quiz progress record
 */
export const getQuizProgressById = async (progressId) => {
	try {
		const progress = await QuizProgress.findById(progressId)
			.populate('user', 'name email')
			.populate('course', 'title')
			.populate('quiz', 'title description passingScorePercent')
			.populate('lastAttemptId');

		if (!progress) {
			throw new AppError('Quiz progress not found', 404);
		}

		return progress;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 404);
	}
};

/**
 * Get quiz performance statistics
 * @param {string} quizId - Quiz ID
 * @returns {Object} Statistics object
 */
export const getQuizPerformanceStats = async (quizId) => {
	try {
		const stats = await QuizProgress.aggregate([
			{ $match: { quiz: mongoose.Types.ObjectId(quizId) } },
			{
				$group: {
					_id: null,
					totalAttempts: { $sum: '$totalAttempts' },
					totalStudents: { $sum: 1 },
					studentsPassed: { $sum: { $cond: ['$isPassed', 1, 0] },  },
					studentsFailed: { $sum: { $cond: [{ $not: '$isPassed' }, 1, 0] } },
					avgBestScore: { $avg: '$bestScore' },
					avgLatestScore: { $avg: '$latestScore' },
					maxScore: { $max: '$bestScore' },
					minScore: { $min: '$bestScore' },
				},
			},
		]);

		const result = stats.length > 0 ? stats[0] : {};

		if (result.totalStudents) {
			result.passPercentage = ((result.studentsPassed / result.totalStudents) * 100).toFixed(2);
		} else {
			result.passPercentage = 0;
		}

		return result;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Get all quiz progress for a course
 * @param {string} courseId - Course ID
 * @param {number} limit - Limit results
 * @param {number} skip - Skip results
 * @returns {Object} Array of quiz progress records
 */
export const getCourseQuizProgress = async (courseId, limit = 10, skip = 0) => {
	try {
		const total = await QuizProgress.countDocuments({ course: courseId });
		const records = await QuizProgress.find({ course: courseId })
			.populate('user', 'name email')
			.populate('quiz', 'title')
			.limit(limit)
			.skip(skip)
			.sort({ lastAttemptAt: -1 });

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

// ==================== UPDATE OPERATIONS ====================

/**
 * Update quiz progress
 * @param {string} progressId - Quiz progress ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated quiz progress
 */
export const updateQuizProgress = async (progressId, updateData) => {
	try {
		const allowedFields = [
			'enrollmentStatus',
			'totalAttempts',
			'attemptsPassed',
			'attemptsFailed',
			'bestScore',
			'latestScore',
			'isPassed',
			'passingScorePercent',
			'lastAttemptId',
			'lastAttemptDuration',
			'totalTimeSpent',
			'latestAttemptAnswers',
			'notes',
			'isActive',
		];

		const updatePayload = {};
		Object.keys(updateData).forEach((key) => {
			if (allowedFields.includes(key)) {
				updatePayload[key] = updateData[key];
			}
		});

		const progress = await QuizProgress.findByIdAndUpdate(progressId, updatePayload, {
			new: true,
			runValidators: true,
		})
			.populate('user', 'name email')
			.populate('quiz', 'title');

		if (!progress) {
			throw new AppError('Quiz progress not found', 404);
		}

		return progress;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Update quiz progress for a user-quiz combination
 * @param {string} userId - User ID
 * @param {string} quizId - Quiz ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated quiz progress
 */
export const updateUserQuizProgress = async (userId, quizId, updateData) => {
	try {
		const allowedFields = [
			'enrollmentStatus',
			'totalAttempts',
			'attemptsPassed',
			'attemptsFailed',
			'bestScore',
			'latestScore',
			'isPassed',
			'passingScorePercent',
			'lastAttemptId',
			'lastAttemptDuration',
			'totalTimeSpent',
			'latestAttemptAnswers',
			'notes',
			'isActive',
		];

		const updatePayload = {};
		Object.keys(updateData).forEach((key) => {
			if (allowedFields.includes(key)) {
				updatePayload[key] = updateData[key];
			}
		});

		// Update timestamps
		if (updateData.lastAttemptAt) {
			updatePayload.lastAttemptAt = new Date();
		}
		if (updateData.passedAt && updateData.isPassed) {
			updatePayload.passedAt = new Date();
		}

		const progress = await QuizProgress.findOneAndUpdate(
			{ user: userId, quiz: quizId },
			updatePayload,
			{ new: true, runValidators: true }
		)
			.populate('user', 'name email')
			.populate('quiz', 'title');

		if (!progress) {
			throw new AppError('Quiz progress not found', 404);
		}

		return progress;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Update quiz progress after an attempt
 * @param {string} userId - User ID
 * @param {string} quizId - Quiz ID
 * @param {Object} attemptData - Attempt data {score, totalPoints, duration, attemptId}
 * @returns {Object} Updated quiz progress
 */
export const updateProgressWithAttempt = async (userId, quizId, attemptData) => {
	try {
		const progress = await QuizProgress.findOne({ user: userId, quiz: quizId });

		if (!progress) {
			throw new AppError('Quiz progress not found', 404);
		}

		const scorePercent = ((attemptData.score / attemptData.totalPoints) * 100).toFixed(2);
		const isPassed = scorePercent >= progress.passingScorePercent;

		// Update attempt counts
		progress.totalAttempts += 1;
		progress.lastAttemptAt = new Date();
		progress.lastAttemptDuration = attemptData.duration || 0;
		progress.lastAttemptId = attemptData.attemptId;
		progress.latestScore = parseFloat(scorePercent);
		progress.totalTimeSpent += attemptData.duration || 0;
		progress.latestAttemptAnswers = attemptData.answers || [];

		if (!progress.firstAttemptAt) {
			progress.firstAttemptAt = new Date();
		}

		// Update best score and passed status
		if (scorePercent > progress.bestScore) {
			progress.bestScore = parseFloat(scorePercent);
		}

		if (isPassed && !progress.isPassed) {
			progress.isPassed = true;
			progress.passedAt = new Date();
			progress.enrollmentStatus = 'passed';
			progress.attemptsPassed += 1;
		} else if (isPassed) {
			progress.attemptsPassed += 1;
			progress.enrollmentStatus = 'passed';
		} else {
			progress.attemptsFailed += 1;
			progress.enrollmentStatus = 'failed';
		}

		const updated = await progress.save();
		return updated.populate(['user', 'quiz']);
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Mark quiz as passed
 * @param {string} userId - User ID
 * @param {string} quizId - Quiz ID
 * @returns {Object} Updated quiz progress
 */
export const markQuizAsPassed = async (userId, quizId) => {
	try {
		const progress = await QuizProgress.findOneAndUpdate(
			{ user: userId, quiz: quizId },
			{
				isPassed: true,
				enrollmentStatus: 'passed',
				passedAt: new Date(),
			},
			{ new: true, runValidators: true }
		);

		if (!progress) {
			throw new AppError('Quiz progress not found', 404);
		}

		return progress;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

// ==================== DELETE/CLEANUP OPERATIONS ====================

/**
 * Delete quiz progress
 * @param {string} progressId - Quiz progress ID
 * @returns {Object} Deleted progress
 */
export const deleteQuizProgress = async (progressId) => {
	try {
		const deleted = await QuizProgress.findByIdAndDelete(progressId);

		if (!deleted) {
			throw new AppError('Quiz progress not found', 404);
		}

		return deleted;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Delete user quiz progress
 * @param {string} userId - User ID
 * @param {string} quizId - Quiz ID
 * @returns {Object} Deleted progress
 */
export const deleteUserQuizProgress = async (userId, quizId) => {
	try {
		const deleted = await QuizProgress.findOneAndDelete({ user: userId, quiz: quizId });

		if (!deleted) {
			throw new AppError('Quiz progress not found', 404);
		}

		return deleted;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};

/**
 * Reset quiz progress to initial state
 * @param {string} userId - User ID
 * @param {string} quizId - Quiz ID
 * @returns {Object} Reset progress
 */
export const resetQuizProgress = async (userId, quizId) => {
	try {
		const reset = await QuizProgress.findOneAndUpdate(
			{ user: userId, quiz: quizId },
			{
				enrollmentStatus: 'not_started',
				totalAttempts: 0,
				attemptsPassed: 0,
				attemptsFailed: 0,
				bestScore: 0,
				latestScore: 0,
				isPassed: false,
				totalTimeSpent: 0,
				lastAttemptDuration: 0,
				lastAttemptId: null,
				lastAttemptAt: null,
				firstAttemptAt: null,
				passedAt: null,
				latestAttemptAnswers: [],
			},
			{ new: true, runValidators: true }
		);

		if (!reset) {
			throw new AppError('Quiz progress not found', 404);
		}

		return reset;
	} catch (error) {
		throw new AppError(error.message, error.statusCode || 500);
	}
};
