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

export const adminQuestionService = {
  list: async (params = {}) => {
    try {
      const res = await getAxiosInstance().get('/questions', { params });
      return {
        data: res.data?.data ?? [],
        pagination: res.data?.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      };
    } catch (error) {
      throw toServiceError(error, 'Failed to load questions');
    }
  },

  getById: async (id) => {
    try {
      const res = await getAxiosInstance().get(`/questions/${id}`);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to load question');
    }
  },

  create: async (payload) => {
    try {
      const res = await getAxiosInstance().post('/questions', payload);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to create question');
    }
  },

  bulkCreate: async (items) => {
    try {
      const res = await getAxiosInstance().post('/questions/bulk', { items });
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to bulk create questions');
    }
  },

  update: async (id, payload) => {
    try {
      const res = await getAxiosInstance().put(`/questions/${id}`, payload);
      return res.data?.data ?? res.data;
    } catch (error) {
      throw toServiceError(error, 'Failed to update question');
    }
  },

  remove: async (id, { force = false } = {}) => {
    try {
      const res = await getAxiosInstance().delete(`/questions/${id}`, {
        params: force ? { force: '1' } : {},
      });
      return res.data;
    } catch (error) {
      // Surface the 409 conflict body so UI can prompt for force.
      if (error?.response?.status === 409) {
        const e = new Error(error.response.data?.message || 'Question is in use');
        e.code = 'IN_USE';
        e.usedIn = error.response.data?.details?.usedIn;
        throw e;
      }
      throw toServiceError(error, 'Failed to delete question');
    }
  },
};
