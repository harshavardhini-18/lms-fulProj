import AppError from '../utils/AppError.js';
import { Course, User } from '../models/index.js';

export async function createCourse(payload, userId) {
  const creator = await User.findById(userId).lean();
  if (!creator) throw new AppError('Creator user not found', 404);

  const course = await Course.create({
    ...payload,
    createdBy: userId,
    updatedBy: userId,
  });

  return course;
}

export async function listCourses(query = {}) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.createdBy) filter.createdBy = query.createdBy;

  return Course.find(filter).sort({ createdAt: -1 });
}

export async function getCourseById(courseId) {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  return course;
}
