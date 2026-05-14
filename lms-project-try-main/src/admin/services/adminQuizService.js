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

  getById: async (id) => {
    try {
      const res = await getAxiosInstance().get(`/quizzes/${id}`);
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

  update: async (id, payload) => {
    try {
      const res = await getAxiosInstance().put(`/quizzes/${id}`, payload);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to update quiz');
    }
  },

  remove: async (id) => {
    try {
      const res = await getAxiosInstance().delete(`/quizzes/${id}`);
      return res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to delete quiz');
    }
  },

  duplicate: async (id, payload = {}) => {
    try {
      const res = await getAxiosInstance().post(`/quizzes/${id}/duplicate`, payload);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to duplicate quiz');
    }
  },

  publish: async (id) => {
    try {
      const res = await getAxiosInstance().post(`/quizzes/${id}/publish`);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to publish quiz');
    }
  },

  archive: async (id) => {
    try {
      const res = await getAxiosInstance().post(`/quizzes/${id}/archive`);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to archive quiz');
    }
  },
};
