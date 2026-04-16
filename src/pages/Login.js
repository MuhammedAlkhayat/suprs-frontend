import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import api from '../services/api';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaParking } from 'react-icons/fa';

export default function Login() {
  const [form, setForm]       = useState({ email:'', password:'' });
  const [showPw, setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { showToast } = useToast();
  const from = location.state?.from?.pathname || '/dashboard';

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data).then(r => r.data),
    onSuccess: (data) => {
      login(data.user, data.token);
      if (remember) localStorage.setItem('suprs-remember', data.user.email);
      showToast('Welcome back!', `Logged in as ${data.user.email}`, 'success');
      navigate(from, { replace: true });
    },
    onError: (err) => {
      showToast('Login failed', err.response?.data?.error || 'Invalid credentials', 'error');
    },
  });

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = (e) => { e.preventDefault(); mutation.mutate(form); };

  return (
    <div className="auth-page">
      <div className="auth-card anim-scale">
        {/* Logo */}
        <div className="auth-logo">🅿️</div>
        <h2 style={{ textAlign:'center', marginBottom:4, fontWeight:800 }}>Welcome back</h2>
        <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:14, marginBottom:28 }}>
          Sign in to your SUPRS account
        </p>

        <form onSubmit={submit}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" size={14} />
              <input name="email" type="email" className="form-input"
                placeholder="you@example.com" value={form.email}
                onChange={handle} required autoComplete="email" />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" size={14} />
              <input name="password" type={showPw ? 'text' : 'password'}
                className="form-input" placeholder="••••••••"
                value={form.password} onChange={handle} required autoComplete="current-password" />
              <button type="button" className="input-action" onClick={() => setShowPw(s => !s)}>
                {showPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <input type="checkbox" id="remember" checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ width:16, height:16, accentColor:'var(--primary)', cursor:'pointer' }} />
            <label htmlFor="remember" style={{ fontSize:13, color:'var(--text-muted)', cursor:'pointer' }}>
              Remember me
            </label>
          </div>

          <button type="submit" className="btn-suprs" disabled={mutation.isPending}
            style={{ width:'100%', justifyContent:'center', padding:'14px' }}>
            {mutation.isPending ? (
              <><span className="suprs-spinner" style={{ width:18, height:18, borderWidth:2 }} /> Signing in…</>
            ) : 'Sign In →'}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign:'center', fontSize:13, color:'var(--text-muted)', margin:0 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'var(--primary)', fontWeight:600 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}