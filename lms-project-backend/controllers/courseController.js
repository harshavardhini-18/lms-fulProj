import asyncHandler from '../utils/asyncHandler.js';
import { createCourse, getCourseById, listCourses } from '../services/courseService.js';

export const create = asyncHandler(async (req, res) => {
  const course = await createCourse(req.body, req.user._id);
  res.status(201).json({ success: true, data: course });
});

export const list = asyncHandler(async (req, res) => {
  const courses = await listCourses(req.query);
  res.json({ success: true, data: courses });
});

export const getById = asyncHandler(async (req, res) => {
  const course = await getCourseById(req.params.courseId);
  res.json({ success: true, data: course });
});
