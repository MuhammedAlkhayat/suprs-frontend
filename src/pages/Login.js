// src/pages/Login.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import { login as apiLogin, setAuthToken } from '../services/api';
import { initSocket } from '../services/socket';

export default function Login() {
  const auth = useAuth(); // may contain login() or other helpers — used non-blocking
  const authLogin = auth?.login;
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => localStorage.getItem('suprs_remember_email') || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => !!localStorage.getItem('suprs_remember_email'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwScore, setPwScore] = useState(0);
  const [theme, setTheme] = useState(
    typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark'
  );

  // Observe theme attribute so logo updates when user toggles theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const score = calculatePasswordScore(password);
    setPwScore(score);
  }, [password]);

  function calculatePasswordScore(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0..4
  }

  function pwStrengthLabel(score) {
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Okay';
    if (score === 3) return 'Good';
    return 'Strong';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      // Call backend via api helper. Expects POST /auth/login { email, password } -> { token, user }
      const payload = { email: email.trim(), password };
      const data = await apiLogin(payload);

      // Extract token & user from common shapes
      const token = data?.token || data?.accessToken || data?.access_token || null;
      const user = data?.user || data?.profile || data?.userData || null;

      if (!token) {
        // fallback: maybe another layer already stored token in localStorage
        const saved = localStorage.getItem('token');
        if (!saved) throw new Error('Authentication failed (no token returned).');
        setAuthToken(saved);
        try {
          // init socket with the saved token as well (best-effort)
          initSocket(saved);
        } catch (sErr) {
          console.warn('initSocket (fallback saved token) failed', sErr);
        }
      } else {
        // set axios default and persist
        setAuthToken(token);
        try { localStorage.setItem('token', token); } catch (err) {}

        // initialize socket with token for authenticated handshake (best-effort)
        try {
          initSocket(token);
        } catch (sErr) {
          console.warn('initSocket failed', sErr);
        }
      }

      if (user) {
        try { localStorage.setItem('user', JSON.stringify(user)); } catch (err) {}
      }

      // call context login if provided — attempt a couple common signatures (non-blocking)
      if (typeof authLogin === 'function') {
        try {
          // common signature: login(user, token)
          await authLogin(user, token);
        } catch (err1) {
          try {
            // fallback common signature: login(email, password)
            await authLogin(email.trim(), password);
          } catch (err2) {
            // ignore — context may not need invocation or has different API
          }
        }
      }

      if (remember) localStorage.setItem('suprs_remember_email', email.trim());
      else localStorage.removeItem('suprs_remember_email');

      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_URL-aware paths (works with CRA and GitHub Pages)
  const base = process.env.PUBLIC_URL || '';
  const logoLight = `${base}/logo-light.png`;
  const logoDark = `${base}/logo-dark.png`;
  const logoDefault = `${base}/logo.png`;
  const logoSrc = theme === 'light' ? logoLight : logoDark;

  function handleLogoError(e) {
    const img = e.currentTarget;
    if (!img.dataset.fallbackTried) {
      img.dataset.fallbackTried = '1';
      img.src = logoDefault;
    } else {
      img.style.display = 'none';
    }
  }

  return (
    <div className="page page-login" role="main" aria-labelledby="login-heading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="auth-card" style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="auth-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={logoSrc}
              alt="SUPRS logo"
              className="auth-logo"
              onError={handleLogoError}
              style={{ height: 64, width: 'auto' }}
            />
          </div>
          <ThemeToggle />
        </div>

        <h2 id="login-heading" style={{ margin: '6px 0 8px' }}>Welcome back</h2>
        <p className="muted" style={{ marginBottom: 18 }}>Sign in to SUPRS Smart Parking System</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-required="true"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 6 }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-required="true"
                style={{ paddingRight: 110 }}
              />
              <button
                type="button"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((s) => !s)}
                className="btn-ghost"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  height: 36,
                  padding: '0 10px',
                  borderRadius: 8,
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div
              aria-hidden="true"
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}
            >
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(pwScore / 4) * 100}%`,
                    background:
                      pwScore <= 1
                        ? '#ef4444'
                        : pwScore === 2
                        ? '#f59e0b'
                        : pwScore === 3
                        ? '#10b981'
                        : 'linear-gradient(90deg,#10b981,#00d2ff)',
                    transition: 'width 180ms ease',
                  }}
                />
              </div>
              <div style={{ minWidth: 72, textAlign: 'right', fontSize: 13, color: 'var(--text-secondary)' }}>
                {password ? pwStrengthLabel(pwScore) : ''}
              </div>
            </div>
          </div>

          {error && <div role="alert" className="error-text" style={{ marginTop: 12 }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                aria-label="Remember my email"
              /> Remember me
            </label>

            <Link to="/forgot" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              Forgot?
            </Link>
          </div>

          <button
            type="submit"
            className="btn-suprs"
            disabled={loading}
            style={{ marginTop: 18 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
