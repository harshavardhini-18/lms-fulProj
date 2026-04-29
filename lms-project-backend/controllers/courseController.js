import asyncHandler from '../utils/asyncHandler.js';
import { 
  createCourse, 
  getCourseById, 
  listCourses,
  getCourseWithModules,
  getModule,
  getLesson,
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson
} from '../services/courseService.js';

export const create = asyncHandler(async (req, res) => {
  const course = await createCourse(req.body, req.user);
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

// Get course with all modules and lessons (for learning view)
export const getCourseDetail = asyncHandler(async (req, res) => {
  const courseData = await getCourseWithModules(req.params.courseId, req.user);
  res.json({ success: true, data: courseData });
});

// Get a specific module
export const getModuleDetail = asyncHandler(async (req, res) => {
  const module = await getModule(req.params.moduleId, req.user);
  res.json({ success: true, data: module });
});

// Get a specific lesson within a module
export const getLessonDetail = asyncHandler(async (req, res) => {
  const lesson = await getLesson(req.params.moduleId, req.params.lessonId, req.user);
  res.json({ success: true, data: lesson });
});

// UPDATE COURSE
export const update = asyncHandler(async (req, res) => {
  const course = await updateCourse(req.params.courseId, req.body, req.user);
  res.json({ success: true, data: course });
});

// DELETE COURSE
export const deleteCourseHandler = asyncHandler(async (req, res) => {
  const result = await deleteCourse(req.params.courseId, req.user);
  res.json({ success: true, data: result });
});

// CREATE MODULE
export const createModuleHandler = asyncHandler(async (req, res) => {
  const module = await createModule(req.params.courseId, req.body, req.user);
  res.status(201).json({ success: true, data: module });
});

// UPDATE MODULE
export const updateModuleHandler = asyncHandler(async (req, res) => {
  const module = await updateModule(req.params.courseId, req.params.moduleId, req.body, req.user);
  res.json({ success: true, data: module });
});

// DELETE MODULE
export const deleteModuleHandler = asyncHandler(async (req, res) => {
  const result = await deleteModule(req.params.courseId, req.params.moduleId, req.user);
  res.json({ success: true, data: result });
});

// CREATE LESSON
export const createLessonHandler = asyncHandler(async (req, res) => {
  const lesson = await createLesson(req.params.courseId, req.params.moduleId, req.body, req.user);
  res.status(201).json({ success: true, data: lesson });
});

// UPDATE LESSON
export const updateLessonHandler = asyncHandler(async (req, res) => {
  const lesson = await updateLesson(req.params.courseId, req.params.moduleId, req.params.lessonId, req.body, req.user);
  res.json({ success: true, data: lesson });
});

// DELETE LESSON
export const deleteLessonHandler = asyncHandler(async (req, res) => {
  const result = await deleteLesson(req.params.courseId, req.params.moduleId, req.params.lessonId, req.user);
  res.json({ success: true, data: result });
});
