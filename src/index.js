import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './index.css';
import './App.css';

// ── QueryClient — production-grade config ─────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 60 * 2,   // 2 min
      gcTime:             1000 * 60 * 10,  // 10 min
      retry:              2,
      retryDelay:         (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: true,
      refetchOnReconnect:   true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ── Theme initializer (dark/light mode persistence) ───────────
const savedTheme = localStorage.getItem('suprs-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// ── Performance: preconnect to backend ───────────────────────
const BACKEND = process.env.REACT_APP_API_URL || 'https://suprs-backend.onrender.com';
const link = document.createElement('link');
link.rel = 'preconnect';
link.href = BACKEND;
document.head.appendChild(link);

// ── App metadata ─────────────────────────────────────────────
document.title = 'SUPRS — Smart Parking System';
const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
metaDesc.name = 'description';
metaDesc.content = 'SUPRS Smart Urban Parking Reservation System — Real-time slot booking, payments, and analytics.';
document.head.appendChild(metaDesc);

// ── Render ────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);