// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './services/queryClient';
import { AuthProvider } from './hooks/useAuth';
import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);