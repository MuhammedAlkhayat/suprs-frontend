// src/hooks/useAuth.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [token, setTokenState] = useState(() => localStorage.getItem('token') || null);

  const setToken = (t) => {
    setTokenState(t);
    if (t) {
      localStorage.setItem('token', t);
      setAuthToken(t);
    } else {
      localStorage.removeItem('token');
      setAuthToken(null);
    }
  };

  useEffect(() => {
    if (token) setAuthToken(token);
  }, []);

  const signIn = (userData, tokenValue) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenValue);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, signIn, logout, setUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}