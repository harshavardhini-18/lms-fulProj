import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const getAxiosInstance = () => {
  const token = localStorage.getItem('accessToken');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const adminQuizService = {
  getAllQuizzes: async () => {
    const instance = getAxiosInstance();
    const response = await instance.get('/quizzes');
    return response.data;
  },

  getQuiz: async (quizId) => {
    const instance = getAxiosInstance();
    const response = await instance.get(`/quizzes/${quizId}`);
    return response.data;
  },

  createQuiz: async (data) => {
    const instance = getAxiosInstance();
    const response = await instance.post('/quizzes', data);
    return response.data;
  },

  updateQuiz: async (quizId, data) => {
    const instance = getAxiosInstance();
    const response = await instance.put(`/quizzes/${quizId}`, data);
    return response.data;
  },

  deleteQuiz: async (quizId) => {
    const instance = getAxiosInstance();
    const response = await instance.delete(`/quizzes/${quizId}`);
    return response.data;
  },
};
