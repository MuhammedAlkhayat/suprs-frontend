import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('suprs_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('suprs_token') || null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('suprs_token', token);
      api.setToken(token);
    } else {
      localStorage.removeItem('suprs_token');
      api.setToken(null);
    }
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('suprs_user', JSON.stringify(user));
    else localStorage.removeItem('suprs_user');
  }, [user]);

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}