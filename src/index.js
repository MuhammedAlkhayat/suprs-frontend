// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import queryClient from './queryClient';
import { setAuthToken } from './services/api';

// socket helpers
import { initSocket, cleanupSocket } from './services/socket';

// CSS import order: vendor -> base -> app -> overrides/theme
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './styles/suprs-theme.css';
import './App.css';
import './styles/overrides.css';

// Apply saved token (if any) before React mounts to avoid flash of unauthenticated requests
try {
  const savedToken = localStorage.getItem('token');
  if (savedToken) {
    setAuthToken(savedToken);
    // initialize socket with token for authenticated handshake
    try { initSocket(savedToken); } catch (e) { console.warn('socket init failed', e); }
  }
} catch (err) {
  // ignore localStorage errors
  // console.warn('index: reading token failed', err);
}

// Keep auth + socket in sync across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (evt) => {
    if (evt.key !== 'token') return;
    const newToken = evt.newValue;
    if (newToken) {
      // user logged in in another tab
      try {
        setAuthToken(newToken);
        initSocket(newToken);
      } catch (e) {
        console.warn('storage event (login) handling failed', e);
      }
    } else {
      // user logged out in another tab
      try {
        setAuthToken(null);
        cleanupSocket();
      } catch (e) {
        console.warn('storage event (logout) handling failed', e);
      }
    }
  });

  // Cleanup socket on page unload to avoid dangling connections
  window.addEventListener('beforeunload', () => {
    try {
      cleanupSocket();
    } catch (e) {
      /* ignore */
    }
  });
}

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
