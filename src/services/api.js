import axios from 'axios';

const BASE = (process.env.REACT_APP_API_BASE || 'https://suprs-backend.onrender.com/api').replace(/\/$/, '');

const api = axios.create({ baseURL: BASE, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/#/login';
    }
    return Promise.reject(err);
  }
);

export function setAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

export const login = (d) => api.post('/auth/login', d).then(r => r.data);
export const register = (d) => api.post('/auth/register', d).then(r => r.data);
export const getSlots = () => api.get('/slots').then(r => r.data);
export const bookSlot = (d) => api.post('/bookings', d).then(r => r.data);
export const getBookings = () => api.get('/bookings').then(r => r.data);
export const getNotifications = () => api.get('/notifications').then(r => r.data);
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`).then(r => r.data);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all').then(r => r.data);
export const createPaymentIntent = (d) => api.post('/payments/create-intent', d).then(r => r.data);
export const payAtGate = (d) => api.post('/payments/pay-at-gate', d).then(r => r.data);
export const getMyPayments = () => api.get('/payments/my-payments').then(r => r.data);
export const sendOtp = (d) => api.post('/auth/send-otp', d).then(r => r.data);
export const verifyOtp = (d) => api.post('/auth/verify-otp', d).then(r => r.data);

export default api;