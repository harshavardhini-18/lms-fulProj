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

export const adminModuleService = {
  getModule: async (courseId, moduleId) => {
    const instance = getAxiosInstance();
    const response = await instance.get(`/courses/${courseId}/modules/${moduleId}`);
    return response.data;
  },

  createModule: async (courseId, data) => {
    const instance = getAxiosInstance();
    const response = await instance.post(`/courses/${courseId}/modules`, data);
    return response.data;
  },

  updateModule: async (courseId, moduleId, data) => {
    const instance = getAxiosInstance();
    const response = await instance.put(`/courses/${courseId}/modules/${moduleId}`, data);
    return response.data;
  },

  deleteModule: async (courseId, moduleId) => {
    const instance = getAxiosInstance();
    const response = await instance.delete(`/courses/${courseId}/modules/${moduleId}`);
    return response.data;
  },
};
