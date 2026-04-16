import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Spinner } from 'react-bootstrap';
import { useMutation } from '@tanstack/react-query';
import { FaLock, FaEnvelope, FaParking, FaUser, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';
import { register as apiRegister } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const float = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}`;

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 20% 80%, rgba(0,210,255,0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(58,123,213,0.08) 0%, transparent 50%), #0f172a;
  padding: 20px;
`;

const Card = styled.div`
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 28px; padding: 3rem 2.5rem;
  width: 100%; max-width: 440px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.5);
`;

const LogoIcon = styled.div`
  width: 72px; height: 72px;
  background: linear-gradient(135deg, #00d2ff, #3a7bd5);
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.5rem;
  animation: ${float} 3s ease-in-out infinite;
  box-shadow: 0 0 30px rgba(0,210,255,0.3);
`;

const InputWrap = styled.div`
  position: relative; margin-bottom: 1rem;
  .icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; }
  .eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #64748b; cursor: pointer; background: none; border: none; padding: 0; }
  input {
    width: 100%; padding: 13px 44px;
    background: rgba(15,23,42,0.7) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 12px !important; color: #f8fafc !important; font-size: 15px;
    &:focus { outline: none; border-color: #00d2ff !important; box-shadow: 0 0 0 3px rgba(0,210,255,0.15) !important; }
    &::placeholder { color: #475569; }
  }
`;

const StrengthBar = styled.div`
  height: 4px; border-radius: 2px; margin-top: 6px;
  background: ${p => p.$strength === 0 ? '#334155' : p.$strength === 1 ? '#ef4444' : p.$strength === 2 ? '#eab308' : '#22c55e'};
  width: ${p => p.$strength * 33.3}%;
  transition: all 0.3s ease;
`;

const SubmitBtn = styled.button`
  width: 100%; padding: 14px !important;
  background: linear-gradient(135deg, #00d2ff, #3a7bd5) !important;
  border: none !important; border-radius: 14px !important;
  color: white !important; font-weight: 700 !important; font-size: 15px !important;
  letter-spacing: 1px; margin-top: 8px;
  &:hover:not(:disabled) { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(0,210,255,0.35) !important; }
  &:disabled { opacity: 0.6 !important; cursor: not-allowed; }
`;

function getStrength(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 6) s++;
  if (/[A-Z]/.test(p) || /[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function Register() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');
  const strength = getStrength(form.password);

  const mutation = useMutation({
    mutationFn: apiRegister,
    onSuccess: (data) => { signIn(data.user, data.token); navigate('/dashboard'); },
    onError: (e) => setErr(e?.response?.data?.error || 'Registration failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault(); setErr('');
    if (form.password !== form.confirm) return setErr('Passwords do not match');
    if (form.password.length < 6) return setErr('Password must be at least 6 characters');
    mutation.mutate({ name: form.name, email: form.email, password: form.password });
  };

  return (
    <PageWrapper>
      <Card>
        <LogoIcon><FaParking size={32} color="#001219" /></LogoIcon>
        <h2 style={{ textAlign: 'center', fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>Create Account</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 28 }}>Join SUPRS Smart Parking</p>

        {err && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <InputWrap>
            <FaUser className="icon" size={14} />
            <input type="text" placeholder="Full name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </InputWrap>
          <InputWrap>
            <FaEnvelope className="icon" size={14} />
            <input type="email" placeholder="Email address" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </InputWrap>
          <InputWrap>
            <FaLock className="icon" size={14} />
            <input type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
            <button type="button" className="eye" onClick={() => setShowPass(s => !s)}>
              {showPass ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
            </button>
          </InputWrap>
          {form.password && <StrengthBar $strength={strength} />}
          {form.password && (
            <div style={{ fontSize: 11, color: strength === 3 ? '#22c55e' : strength === 2 ? '#eab308' : '#ef4444', marginBottom: 8, marginTop: 4 }}>
              {strength === 3 ? '✓ Strong password' : strength === 2 ? 'Medium strength' : 'Weak password'}
            </div>
          )}
          <InputWrap>
            <FaCheckCircle className="icon" size={14} />
            <input type="password" placeholder="Confirm password" value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })} required />
          </InputWrap>

          <SubmitBtn type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Spinner animation="border" size="sm" /> : 'CREATE ACCOUNT'}
          </SubmitBtn>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#00d2ff', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </p>
      </Card>
    </PageWrapper>
  );
}