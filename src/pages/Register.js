// src/pages/Register.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { register as apiRegister, setAuthToken } from '../services/api';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUser } from 'react-icons/fa';
import ThemeToggle from '../components/ThemeToggle';

function getStrength(pw) {
  let s = 0;
  if (!pw) return 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const auth = useAuth();
  const authLogin = auth?.login;
  const navigate = useNavigate();
  const { showToast } = useToast();

  // theme + logo switching (matches Login)
  const [theme, setTheme] = useState(
    typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
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

  const strength = getStrength(form.password);

  const mutation = useMutation({
    mutationFn: (data) => apiRegister(data),
    onSuccess: async (data) => {
      // Handle common response shapes: { token, user } or { accessToken, user } etc.
      const token = data?.token || data?.accessToken || data?.access_token || null;
      const user = data?.user || data?.profile || data?.data?.user || null;

      if (token) {
        setAuthToken(token);
        try { localStorage.setItem('token', token); } catch (e) {}
      }

      if (user) {
        try { localStorage.setItem('user', JSON.stringify(user)); } catch (e) {}
      }

      // Best-effort: update auth context if a login setter exists
      if (typeof authLogin === 'function') {
        try {
          // common signature: login(user, token)
          await authLogin(user, token);
        } catch (err1) {
          try {
            // fallback signature: login(email, password)
            await authLogin(form.email, form.password);
          } catch (err2) {
            // ignore if different API
          }
        }
      }

      showToast('Account created!', 'Welcome to SUPRS 🎉', 'success');
      navigate('/dashboard', { replace: true });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Please try again';
      showToast('Registration failed', msg, 'error');
    },
  });

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    // basic client validation
    if (!form.name || !form.email || !form.password) {
      showToast('Missing fields', 'Please fill all required fields', 'error');
      return;
    }
    if (form.password.length < 8) {
      showToast('Weak password', 'Password must be at least 8 characters', 'error');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div
      className="page page-register"
      role="main"
      aria-labelledby="register-heading"
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div className="auth-card" style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={logoSrc}
              alt="SUPRS logo"
              className="auth-logo"
              onError={handleLogoError}
              style={{ height: 64, width: 'auto' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 id="register-heading" style={{ margin: 0, fontWeight: 900 }}>
                Create account
              </h2>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Join SUPRS Smart Parking System</div>
            </div>
          </div>

          <ThemeToggle />
        </div>

        <form onSubmit={submit} noValidate>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Full Name</label>
            <div className="input-wrapper">
              <FaUser className="input-icon" size={13} />
              <input
                name="name"
                type="text"
                className="form-input"
                placeholder="Mohammed Al-Khayyat"
                value={form.name}
                onChange={handle}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Email address</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" size={14} />
              <input
                name="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handle}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 6 }}>
            <label className="form-label">Password</label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <FaLock className="input-icon" size={14} />
              <input
                name="password"
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handle}
                required
                minLength={8}
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                className="input-action"
                aria-pressed={showPw}
                onClick={() => setShowPw((s) => !s)}
                style={{ position: 'absolute', right: 8, top: 8, height: 36, padding: '0 10px', borderRadius: 8 }}
              >
                {showPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>

            {form.password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className="strength-bar" style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  <div
                    className="strength-bar-fill"
                    style={{
                      width: `${(strength / 4) * 100}%`,
                      height: '100%',
                      background: STRENGTH_COLORS[strength],
                      transition: 'width 160ms ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: STRENGTH_COLORS[strength], marginTop: 6, fontWeight: 700 }}>
                  {STRENGTH_LABELS[strength]}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={mutation.isPending}
            style={{ marginTop: 18, width: '100%', padding: '14px' }}
          >
            {mutation.isPending ? (
              <><span className="suprs-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating…</>
            ) : 'Create Account →'}
          </button>
        </form>

        <div style={{ height: 18 }} />

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}