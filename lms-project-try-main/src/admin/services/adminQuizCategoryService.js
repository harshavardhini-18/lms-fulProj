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

export const adminQuizCategoryService = {
  list: async (params = {}) => {
    try {
      const res = await getAxiosInstance().get('/quiz-categories', { params });
      return res.data?.data ?? [];
    } catch (error) {
      throw toServiceError(error, 'Failed to load categories');
    }
  },

  create: async (payload) => {
    try {
      const res = await getAxiosInstance().post('/quiz-categories', payload);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to create category');
    }
  },

  update: async (id, payload) => {
    try {
      const res = await getAxiosInstance().put(`/quiz-categories/${id}`, payload);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to update category');
    }
  },

  remove: async (id) => {
    try {
      const res = await getAxiosInstance().delete(`/quiz-categories/${id}`);
      return res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to delete category');
    }
  },
};
