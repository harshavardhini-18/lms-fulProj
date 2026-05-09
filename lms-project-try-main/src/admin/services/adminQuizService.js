import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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

export const adminQuizService = {
  listByCourse: async (courseId) => {
    try {
      const res = await getAxiosInstance().get(`/quizzes/course/${courseId}`);
      return res.data?.data ?? res.data ?? [];
    } catch (error) {
      throw toServiceError(error, 'Failed to load quizzes');
    }
  },

  getById: async (quizId) => {
    try {
      const res = await getAxiosInstance().get(`/quizzes/${quizId}`);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to load quiz');
    }
  },

  create: async (payload) => {
    try {
      const res = await getAxiosInstance().post('/quizzes', payload);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to create quiz');
    }
  },

  update: async (quizId, payload) => {
    try {
      const res = await getAxiosInstance().put(`/quizzes/${quizId}`, payload);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to update quiz');
    }
  },

  remove: async (quizId) => {
    try {
      const res = await getAxiosInstance().delete(`/quizzes/${quizId}`);
      return res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to delete quiz');
    }
  },
};
