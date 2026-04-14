// src/pages/Login.js
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useMutation } from 'react-query';
import { gsap } from 'gsap';
import { FaLock, FaUser, FaParking } from 'react-icons/fa';
import api from '../services/api';

const LoginWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
`;

const GlassCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3rem;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

const StyledButton = styled(Button)`
  background: linear-gradient(45deg, #00d2ff 0%, #3a7bd5 100%);
  border: none;
  padding: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.02);
    background: linear-gradient(45deg, #3a7bd5 0%, #00d2ff 100%);
  }
`;

const InputGroup = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  svg {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
  }
  input {
    padding-left: 45px !important;
    background: rgba(15, 23, 42, 0.6) !important;
    border: 1px solid #334155 !important;
    color: white !important;
    &:focus {
      border-color: #00d2ff !important;
      box-shadow: 0 0 0 0.25rem rgba(0, 210, 255, 0.25) !important;
    }
  }
`;

export default function Login() {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [credentials, setCredentials] = useState({ email: 'user@example.com', password: 'password' });

  useEffect(() => {
    if (!cardRef.current) return;

    const anim = gsap.fromTo(
      cardRef.current,
      { y: 50, opacity: 0 },
      {
        duration: 1.2,
        y: 0,
        opacity: 1,
        ease: 'power4.out',
        onComplete() {
          try { if (cardRef.current) cardRef.current.style.opacity = ''; } catch (e) {}
        }
      }
    );

    return () => {
      try {
        if (anim) anim.kill();
        if (cardRef.current) cardRef.current.style.opacity = '1';
      } catch (e) {}
    };
  }, []);

  const mutation = useMutation(
    (loginData) => api.post('/auth/login', loginData),
    {
      onSuccess: (data) => {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        navigate('/dashboard');
      }
    }
  );

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(credentials);
  };

  return (
    <LoginWrapper>
      <GlassCard ref={cardRef}>
        <div className="text-center mb-4">
          <FaParking size={50} color="#00d2ff" className="mb-3" />
          <h2 className="fw-bold">SUPRS Login</h2>
          <p className="text-muted">Smart Urban Parking & Reservation System</p>
        </div>

        {mutation.isError && (
          <Alert variant="danger" className="py-2 text-center">
            {mutation.error?.response?.data?.message || 'Connection Error'}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <FaUser />
            <Form.Control
              type="email"
              name="email"
              placeholder="Email Address"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </InputGroup>

          <InputGroup>
            <FaLock />
            <Form.Control
              type="password"
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </InputGroup>

          <StyledButton type="submit" className="w-100 mt-3" disabled={mutation.isLoading}>
            {mutation.isLoading ? <Spinner animation="border" size="sm" /> : 'SIGN IN'}
          </StyledButton>
        </Form>

        <div className="mt-4 text-center small text-muted">
          Default: user@example.com / password
        </div>
      </GlassCard>
    </LoginWrapper>
  );
}