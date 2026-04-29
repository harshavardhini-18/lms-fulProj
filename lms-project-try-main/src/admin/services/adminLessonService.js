import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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

export const adminLessonService = {
  getLesson: async (courseId, moduleId, lessonId) => {
    const instance = getAxiosInstance();
    const response = await instance.get(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
    );
    return response.data;
  },

  createLesson: async (courseId, moduleId, data) => {
    const instance = getAxiosInstance();
    const response = await instance.post(
      `/courses/${courseId}/modules/${moduleId}/lessons`,
      data
    );
    return response.data;
  },

  updateLesson: async (courseId, moduleId, lessonId, data) => {
    const instance = getAxiosInstance();
    const response = await instance.put(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
      data
    );
    return response.data;
  },

  deleteLesson: async (courseId, moduleId, lessonId) => {
    const instance = getAxiosInstance();
    const response = await instance.delete(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
    );
    return response.data;
  },
};
