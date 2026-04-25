// src/pages/ForgotPassword.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(
    typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setStatus('loading');

    try {
      await api.post('/auth/forgot', { email: email.trim() });
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError(err?.response?.data?.message || 'Unable to send reset email. Please try again later.');
    }
  }

  return (
    <div
      className="page page-forgot"
      role="main"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div className="auth-card" style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={logoSrc}
              alt="SUPRS logo"
              onError={handleLogoError}
              style={{ height: 64, width: 'auto' }}
            />
            <h2 style={{ margin: 0 }}>Reset your password</h2>
          </div>
          <ThemeToggle />
        </div>

        <p className="muted" style={{ marginBottom: 18 }}>
          Enter the email you used for your SUPRS account. We&apos;ll send instructions to reset your password.
        </p>

        {status === 'success' ? (
          <div role="status" className="info-box" style={{ padding: 16 }}>
            If an account with that email exists, you’ll receive a password reset email shortly.
            <div style={{ marginTop: 12 }}>
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" htmlFor="forgot-email">
                Email
              </label>
              <input
                id="forgot-email"
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

            {error && (
              <div role="alert" className="error-text" style={{ marginBottom: 12 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <button type="submit" className="btn-suprs" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending…' : 'Send reset email'}
              </button>

              <Link to="/login" className="btn-ghost" style={{ marginLeft: 'auto' }}>
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}