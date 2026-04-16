import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Spinner } from 'react-bootstrap';
import { useMutation } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { FaLock, FaEnvelope, FaParking, FaEye, FaEyeSlash } from 'react-icons/fa';
import { login as apiLogin } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 20% 80%, rgba(0,210,255,0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(58,123,213,0.08) 0%, transparent 50%),
              #0f172a;
  padding: 20px;
`;

const Card = styled.div`
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 28px;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 440px;
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
  position: relative;
  margin-bottom: 1.2rem;
  .icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; }
  .eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #64748b; cursor: pointer; background: none; border: none; padding: 0; }
  input {
    width: 100%;
    padding: 13px 44px;
    background: rgba(15,23,42,0.7) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 12px !important;
    color: #f8fafc !important;
    font-size: 15px;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:focus {
      outline: none;
      border-color: #00d2ff !important;
      box-shadow: 0 0 0 3px rgba(0,210,255,0.15) !important;
    }
    &::placeholder { color: #475569; }
  }
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 14px !important;
  background: linear-gradient(135deg, #00d2ff, #3a7bd5) !important;
  border: none !important;
  border-radius: 14px !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 15px !important;
  letter-spacing: 1px;
  margin-top: 8px;
  transition: transform 0.2s, box-shadow 0.2s !important;
  &:hover:not(:disabled) { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(0,210,255,0.35) !important; }
  &:disabled { opacity: 0.6 !important; cursor: not-allowed; }
`;

const ErrorBox = styled.div`
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 10px;
  padding: 10px 14px;
  color: #fca5a5;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
`;

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const cardRef = useRef(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current, { y: 40, opacity: 0 }, { duration: 0.8, y: 0, opacity: 1, ease: 'power3.out' });
  }, []);

  const mutation = useMutation({
    mutationFn: apiLogin,
    onSuccess: (data) => {
      signIn(data.user, data.token);
      navigate('/dashboard');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <PageWrapper>
      <Card ref={cardRef}>
        <LogoIcon><FaParking size={32} color="#001219" /></LogoIcon>
        <h2 style={{ textAlign: 'center', fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>Welcome Back</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 28 }}>SUPRS Smart Parking System</p>

        {mutation.isError && (
          <ErrorBox>{mutation.error?.response?.data?.error || 'Invalid credentials. Please try again.'}</ErrorBox>
        )}

        <form onSubmit={handleSubmit}>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 'auto', padding: 0 }} />
              Remember me
            </label>
            <span style={{ color: '#00d2ff', fontSize: 13, cursor: 'pointer' }}>Forgot password?</span>
          </div>

          <SubmitBtn type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Spinner animation="border" size="sm" /> : 'SIGN IN'}
          </SubmitBtn>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 14 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#00d2ff', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
        </p>
      </Card>
    </PageWrapper>
  );
}