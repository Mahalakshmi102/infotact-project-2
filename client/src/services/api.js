import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically inject JWT token into requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('streamweaver_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.data?.token) {
      localStorage.setItem('streamweaver_token', res.data.data.token);
      localStorage.setItem('streamweaver_user', JSON.stringify(res.data.data));
    }
    return res.data;
  },

  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data.data?.token) {
      localStorage.setItem('streamweaver_token', res.data.data.token);
      localStorage.setItem('streamweaver_user', JSON.stringify(res.data.data));
    }
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('streamweaver_token');
    localStorage.removeItem('streamweaver_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('streamweaver_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getProfile: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const datasetService = {
  getDatasets: async () => {
    const res = await api.get('/datasets');
    return res.data;
  },

  uploadDataset: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  deleteDataset: async (id) => {
    const res = await api.delete(`/datasets/${id}`);
    return res.data;
  },
};

export const systemService = {
  getHealth: async () => {
    const res = await axios.get('http://localhost:5000/api/health');
    return res.data;
  },
};

export default api;
