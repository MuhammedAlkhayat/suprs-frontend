// src/services/api.js
import axios from 'axios';

const DEFAULT_FALLBACK = 'https://suprs-backend.onrender.com';

/**
 * Resolve raw base value:
 * - If REACT_APP_API_BASE exists (even as ''), use it.
 * - Else fall back to REACT_APP_API_URL if present.
 * - Else use default production fallback.
 */
const RAW_ENV =
  Object.prototype.hasOwnProperty.call(process.env, 'REACT_APP_API_BASE')
    ? process.env.REACT_APP_API_BASE
    : (process.env.REACT_APP_API_URL || undefined);

const RAW = RAW_ENV === '' ? '' : (RAW_ENV || DEFAULT_FALLBACK);

// Utility: remove trailing slashes (keep empty string as-is)
function trimTrailingSlashes(v) {
  return v === '' ? '' : String(v || '').replace(/\/+$/, '');
}

const trimmed = trimTrailingSlashes(RAW);

// API origin: remove trailing "/api" if present (keep '' for relative mode)
export const API_ORIGIN = trimmed === '' ? '' : trimmed.replace(/\/api$/i, '').replace(/\/+$/, '');

// API_BASE: canonical base for axios and helpers. If relative mode (API_ORIGIN === ''), use '/api'
export const API_BASE = (API_ORIGIN === '' ? '/api' : `${API_ORIGIN}/api`).replace(/\/+$/, '');

// SOCKET_HOST: prefer explicit socket URL env var, else derive from API_ORIGIN (can be '')
export const SOCKET_HOST = (typeof process !== 'undefined' && process.env.REACT_APP_SOCKET_URL)
  ? trimTrailingSlashes(String(process.env.REACT_APP_SOCKET_URL).trim())
  : API_ORIGIN; // may be ''

// SOCKET_PATH: priority - explicit env at runtime (REACT_APP_SOCKET_PATH) can override in socket.js;
// this export is a good default derived from API_BASE
export const SOCKET_PATH = (function defaultSocketPath() {
  try {
    const base = String(API_BASE || '').toLowerCase();
    if (base.includes('/api')) return '/api/socket.io';
  } catch (e) {
    // ignore
  }
  return '/socket.io';
}());

/**
 * Helper to produce full API URL strings (useful when you need the raw URL)
 * apiPath('notifications') -> 'https://.../api/notifications' or '/api/notifications' (relative)
 */
export function apiPath(path = '') {
  const frag = String(path || '').replace(/^\/+/, ''); // remove leading slashes
  if (!API_BASE) return `/${frag}`.replace(/\/+$/, '');
  return `${API_BASE}/${frag}`.replace(/\/+$/, '');
}

// Axios instance: baseURL uses API_BASE (when API_BASE === '/api' axios will use relative requests)
const BASE = API_BASE;
const api = axios.create({
  baseURL: BASE,
  timeout: 20000,
});

// Debug toggle via env
const API_DEBUG = String(process.env.REACT_APP_API_DEBUG || '').toLowerCase() === 'true';

// Convenience: set/unset default Authorization header
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// Centralized logout behavior (clears storage + navigates to /#/login)
export function logout() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('suprs_auth');
    }
  } catch (e) {
    /* ignore storage errors */
  }

  delete api.defaults.headers.common.Authorization;

  if (typeof window !== 'undefined') {
    const baseLoginHash = '/#/login';
    const baseLoginPath = '/login';

    if (!window.location.href.includes(baseLoginHash)) {
      if (window.location.pathname === baseLoginPath) {
        window.location.reload();
      } else {
        window.location.href = baseLoginHash;
      }
    } else {
      window.location.reload();
    }
  }
}

// Request interceptor: attach token if present in localStorage (safe)
api.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers = config.headers || {};
          if (!config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      }
    } catch (e) {
      // ignore storage errors
    }

    if (API_DEBUG) {
      try {
        console.debug(
          '[API REQ]',
          (config.method || '').toUpperCase(),
          (config.baseURL || '') + (config.url || ''),
          config.headers?.Authorization ? 'AUTH' : 'no-auth',
          config.data || config.params || ''
        );
      } catch (e) { /* ignore */ }
    }

    return config;
  },
  (err) => Promise.reject(err)
);

// Response interceptor: handle 401 centrally + debug logging
api.interceptors.response.use(
  (res) => {
    if (API_DEBUG) {
      try {
        console.debug('[API RES]', res.status, res.config.url);
      } catch (e) { /* ignore */ }
    }
    return res;
  },
  (err) => {
    if (err?.response?.status === 401) {
      try {
        logout();
      } catch (e) {
        /* ignore */
      }
    }
    if (API_DEBUG) {
      try {
        console.error(
          '[API ERR]',
          err?.response?.status,
          err?.response?.config?.url,
          err?.response?.data || err.message
        );
      } catch (e) { /* ignore */ }
    }
    return Promise.reject(err);
  }
);

// ----------------- API helpers (same surface as your original file) -----------------

// Auth endpoints
export const login = (d) => api.post('/auth/login', d).then((r) => r.data);
export const register = (d) => api.post('/auth/register', d).then((r) => r.data);

// Slots
export const getSlots = () => api.get('/slots').then((r) => r.data);
export const getSlotById = (id) => api.get(`/slots/${encodeURIComponent(id)}`).then((r) => r.data);
export const createSlot = (d) => api.post('/slots', d).then((r) => r.data);
export const updateSlot = (id, d) => api.patch(`/slots/${encodeURIComponent(id)}`, d).then((r) => r.data);
export const deleteSlot = (id) => api.delete(`/slots/${encodeURIComponent(id)}`).then((r) => r.data);

// Users
export const getUsers = () => api.get('/users').then((r) => r.data);

// Bookings / Payments / Notifications
export const bookSlot = (d) => api.post('/bookings', d).then((r) => r.data);
export const getBookings = () => api.get('/bookings').then((r) => r.data);

export const getNotifications = () => api.get('/notifications').then((r) => r.data);
export const markNotificationRead = (id) => api.patch(`/notifications/${encodeURIComponent(id)}/read`).then((r) => r.data);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all').then((r) => r.data);

export const createPaymentIntent = (d) => api.post('/payments/create-intent', d).then((r) => r.data);
export const payAtGate = (d) => api.post('/payments/pay-at-gate', d).then((r) => r.data);
export const getMyPayments = () => api.get('/payments/my-payments').then((r) => r.data);

// OTP helpers
export const sendOtp = (d) => api.post('/auth/send-otp', d).then((r) => r.data);
export const verifyOtp = (d) => api.post('/auth/verify-otp', d).then((r) => r.data);

export { api as axiosInstance };
export default api;
