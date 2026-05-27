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
    },
  });
};

export const adminUploadService = {
  uploadFile: async (file, options = {}) => {
    const instance = getAxiosInstance();
    const data = new FormData();
    data.append('file', file);
    if (options.folder) data.append('folder', options.folder);
    const response = await instance.post('/uploads', data);
    return response.data;
  },
};
