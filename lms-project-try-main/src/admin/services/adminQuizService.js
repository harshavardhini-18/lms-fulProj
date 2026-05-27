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
  return new Error(apiMessage || fallbackMessage);
}

export const adminQuizService = {
  list: async (params = {}) => {
    try {
      const res = await getAxiosInstance().get('/quizzes', { params });
      return {
        data: res.data?.data ?? [],
        pagination: res.data?.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      };
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

  publish: async (quizId) => {
    try {
      const res = await getAxiosInstance().post(`/quizzes/${quizId}/publish`);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to publish quiz');
    }
  },

  archive: async (quizId) => {
    try {
      const res = await getAxiosInstance().post(`/quizzes/${quizId}/archive`);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to archive quiz');
    }
  },

  duplicate: async (quizId) => {
    try {
      const res = await getAxiosInstance().post(`/quizzes/${quizId}/duplicate`);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to duplicate quiz');
    }
  },
};
