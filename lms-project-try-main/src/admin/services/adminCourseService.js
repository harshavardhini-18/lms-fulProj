import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with auth token
const getAxiosInstance = () => {
  const token = localStorage.getItem('accessToken');
  const userId = localStorage.getItem('lmsUserId') || '1';
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-user-id': userId,
      'Content-Type': 'application/json',
    },
  });
};

function toServiceError(error, fallbackMessage) {
  const apiMessage = error?.response?.data?.message;
  const details = Array.isArray(error?.response?.data?.details)
    ? error.response.data.details.join(', ')
    : '';
  return new Error(apiMessage || details || fallbackMessage);
}

export const adminCourseService = {
  // Get all courses
  getAllCourses: async () => {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.get('/courses', {
        params: { includeAll: true },
      });
      return response.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to load courses');
    }
  },

  // Get single course with all details
  getCourse: async (courseId) => {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.get(`/courses/${courseId}/detail`);
      return response.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to load course');
    }
  },

  // Create new course
  createCourse: async (courseData) => {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.post('/courses', courseData);
      return response.data;
    } catch (error) {
      throw toServiceError(error, 'Error creating course');
    }
  },

  // Update course
  updateCourse: async (courseId, courseData) => {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.put(`/courses/${courseId}`, courseData);
      return response.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to update course');
    }
  },

  // Delete course
  deleteCourse: async (courseId) => {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.delete(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to delete course');
    }
  },
};
