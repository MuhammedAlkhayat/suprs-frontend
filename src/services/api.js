// src/services/api.js
import axios from 'axios';

// Default deployed backend
const DEFAULT_BASE = 'https://suprs-backend.onrender.com';

// Allow overriding with environment variable
const envBase = (process.env.REACT_APP_API_BASE || '').trim();
const base = envBase || DEFAULT_BASE;

const api = axios.create({
  baseURL: `${base.replace(/\/$/, '')}/api`, // e.g. https://.../api
  timeout: 10000,
});

// Attach token from localStorage by default
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

// helper to set/clear axios header programmatically
export function setAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

// API wrappers
export async function login({ email, password }) {
  const res = await api.post('/auth/login', { email, password });
  return res.data; // expect { token, user }
}

export async function getSlots() {
  const res = await api.get('/slots');
  return res.data;
}

export async function bookSlot({ slot_id, user_id }) {
  const res = await api.post('/bookings', { slot_id, user_id });
  return res.data;
}

export async function createPaymentIntent({ amount, currency = 'usd', metadata = {} }) {
  const res = await api.post('/payments/create-payment-intent', { amount, currency, metadata });
  return res.data;
}

export default api;