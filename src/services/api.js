// src/services/api.js
import axios from 'axios';

const DEFAULT_BASE = 'https://suprs-backend.onrender.com/api';
const envBase = (process.env.REACT_APP_API_BASE || '').trim();
const base = (envBase || DEFAULT_BASE).replace(/\/$/, '');

const api = axios.create({ baseURL: base, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

// Named API helpers
export const login = ({ email, password }) =>
  api.post('/auth/login', { email, password }).then(r => r.data);

export const register = ({ email, password, role = 'USER' }) =>
  api.post('/auth/register', { email, password, role }).then(r => r.data);

export const getSlots = () => api.get('/slots').then(r => r.data);

export const bookSlot = ({ slot_id, user_id }) =>
  api.post('/bookings', { slot_id, user_id }).then(r => r.data);

export const getBookings = () => api.get('/bookings').then(r => r.data);

export const createPaymentIntent = ({ amount, currency = 'usd', metadata = {} }) =>
  api.post('/payments/create-payment-intent', { amount, currency, metadata }).then(r => r.data);

export default api;