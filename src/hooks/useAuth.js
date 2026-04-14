// src/hooks/useAuth.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setAuthToken as setApiAuthToken, login as apiLogin } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user'); // unified key -> 'user'
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setApiAuthToken(token);
    } else {
      localStorage.removeItem('token');
      setApiAuthToken(null);
    }
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  // Use the named wrapper that returns res.data (consistent)
  async function signIn({ email, password }) {
    // apiLogin is the exported wrapper that returns `res.data`
    const data = await apiLogin({ email, password });
    // Expecting { token, user }
    const t = data?.token;
    const u = data?.user;
    if (t) setToken(t);
    if (u) setUser(u);
    return { token: t, user: u };
  }

  function signOut() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const val = useContext(AuthContext);
  if (!val) throw new Error('useAuth must be used within AuthProvider');
  return val;
}