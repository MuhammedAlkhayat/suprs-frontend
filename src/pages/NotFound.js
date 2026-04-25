import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const float = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}`;

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: radial-gradient(circle at 50% 50%, rgba(0,210,255,0.06) 0%, transparent 60%), #0f172a;
  text-align: center; padding: 20px;
`;

const BigNum = styled.h1`
  font-size: clamp(6rem, 20vw, 10rem);
  font-weight: 900;
  background: linear-gradient(135deg, #00d2ff, #3a7bd5);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${float} 3s ease-in-out infinite;
  margin: 0; line-height: 1;
`;

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Wrapper>
      <BigNum>404</BigNum>
      <h2 style={{ color: '#f8fafc', fontWeight: 700, marginTop: 16, marginBottom: 8 }}>Page Not Found</h2>
      <p style={{ color: '#64748b', marginBottom: 32, maxWidth: 360 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button onClick={() => navigate('/dashboard')}
        style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
        ← Back to Dashboard
      </button>
    </Wrapper>
  );
}
