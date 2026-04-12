import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',  // updated port here
  timeout: 10000,
});

// Optionally attach token if stored
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;