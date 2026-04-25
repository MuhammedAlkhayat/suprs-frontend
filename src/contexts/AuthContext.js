// src/contexts/AuthContext.js
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { setAuthToken } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore token/user from localStorage (support both separate keys and legacy "suprs_auth")
  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      const u = localStorage.getItem('user');
      if (t) {
        setToken(t);
        setAuthToken(t);
      } else {
        // fallback to legacy single-key storage
        const legacy = localStorage.getItem('suprs_auth');
        if (legacy) {
          try {
            const parsed = JSON.parse(legacy);
            if (parsed?.token) {
              setToken(parsed.token);
              setAuthToken(parsed.token);
            }
            if (parsed?.user) setUser(parsed.user);
          } catch (e) {
            // ignore parse errors
          }
        }
      }

      if (u) {
        try {
          setUser(JSON.parse(u));
        } catch (e) {
          setUser(null);
        }
      }
    } catch (err) {
      console.warn('[Auth] restore failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (userObj, tokenStr) => {
    // primary contract: login(user, token)
    if (tokenStr) {
      setToken(tokenStr);
      setAuthToken(tokenStr);
      try { localStorage.setItem('token', tokenStr); } catch (e) {}
    }
    if (userObj) {
      setUser(userObj);
      try { localStorage.setItem('user', JSON.stringify(userObj)); } catch (e) {}
    }
    // keep legacy key as well for backwards compatibility
    try {
      localStorage.setItem('suprs_auth', JSON.stringify({ user: userObj || null, token: tokenStr || null }));
    } catch (e) {}
    return Promise.resolve();
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('suprs_auth');
    } catch (e) {}
    return Promise.resolve();
  }, []);

  const value = useMemo(() => ({ user, token, loading, login, logout }), [user, token, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
