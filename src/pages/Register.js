import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import api from '../services/api';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUser } from 'react-icons/fa';

function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

export default function Register() {
  const [form, setForm]     = useState({ name:'', email:'', password:'' });
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();
  const { showToast } = useToast();

  const strength = getStrength(form.password);

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/register', data).then(r => r.data),
    onSuccess: (data) => {
      login(data.user, data.token);
      showToast('Account created!', 'Welcome to SUPRS 🎉', 'success');
      navigate('/dashboard');
    },
    onError: (err) => {
      showToast('Registration failed', err.response?.data?.error || 'Please try again', 'error');
    },
  });

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = (e) => { e.preventDefault(); mutation.mutate(form); };

  return (
    <div className="auth-page">
      <div className="auth-card anim-scale">
        <div className="auth-logo">🅿️</div>
        <h2 style={{ textAlign:'center', marginBottom:4, fontWeight:800 }}>Create account</h2>
        <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:14, marginBottom:28 }}>
          Join SUPRS Smart Parking System
        </p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-wrapper">
              <FaUser className="input-icon" size={13} />
              <input name="name" type="text" className="form-input"
                placeholder="Mohammed Al-Khayyat" value={form.name}
                onChange={handle} autoComplete="name" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" size={14} />
              <input name="email" type="email" className="form-input"
                placeholder="you@example.com" value={form.email}
                onChange={handle} required autoComplete="email" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" size={14} />
              <input name="password" type={showPw ? 'text' : 'password'}
                className="form-input" placeholder="Min. 8 characters"
                value={form.password} onChange={handle} required minLength={8} />
              <button type="button" className="input-action" onClick={() => setShowPw(s => !s)}>
                {showPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
            {form.password.length > 0 && (
              <div>
                <div className="strength-bar">
                  <div className="strength-bar-fill"
                    style={{ width:`${(strength/4)*100}%`, background: STRENGTH_COLORS[strength] }} />
                </div>
                <div style={{ fontSize:11, color: STRENGTH_COLORS[strength], marginTop:4, fontWeight:600 }}>
                  {STRENGTH_LABELS[strength]}
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn-suprs" disabled={mutation.isPending}
            style={{ width:'100%', justifyContent:'center', padding:'14px', marginTop:4 }}>
            {mutation.isPending ? (
              <><span className="suprs-spinner" style={{ width:18, height:18, borderWidth:2 }} /> Creating…</>
            ) : 'Create Account →'}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign:'center', fontSize:13, color:'var(--text-muted)', margin:0 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--primary)', fontWeight:600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}