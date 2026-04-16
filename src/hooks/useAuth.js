import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Important: return a safe default so destructuring won't crash
    console.warn('useAuth() called outside of <AuthProvider>. Returning safe defaults.');
    return { user: null, token: null, loading: true, login: () => {}, logout: () => {} };
  }
  return ctx;
}
