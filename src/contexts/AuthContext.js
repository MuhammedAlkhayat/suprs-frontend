import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore from localStorage (safe default)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('suprs_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user ?? null);
        setToken(parsed.token ?? null);
      }
    } catch (err) {
      console.warn('Auth restore failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userObj, tokenStr) => {
    setUser(userObj);
    setToken(tokenStr);
    try {
      localStorage.setItem('suprs_auth', JSON.stringify({ user: userObj, token: tokenStr }));
    } catch (err) {
      console.warn('Auth save failed', err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('suprs_auth');
    } catch (err) {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
