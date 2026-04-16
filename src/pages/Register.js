// src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useMutation } from '@tanstack/react-query'; 
import { FaLock, FaUser, FaParking } from 'react-icons/fa';
import { register as apiRegister } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const Wrapper = styled.div`
  display: flex; align-items: center; justify-content: center; min-height: 100vh;
  background: radial-gradient(circle at top right, #1e293b, #0f172a);
`;
const Card = styled.div`
  background: rgba(255,255,255,0.05); backdrop-filter: blur(15px);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
  padding: 3rem; width: 100%; max-width: 450px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
`;

export default function Register() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [err, setErr] = useState('');

  // ✅ v5 syntax
  const mutation = useMutation({
    mutationFn: apiRegister,
    onSuccess: (data) => {
      signIn(data.user, data.token);
      navigate('/dashboard');
    },
    onError: (e) => setErr(e?.response?.data?.message || 'Registration failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr('');
    if (form.password !== form.confirm) return setErr('Passwords do not match');
    if (form.password.length < 6) return setErr('Password must be at least 6 characters');
    mutation.mutate({ email: form.email, password: form.password });
  };

  return (
    <Wrapper>
      <Card>
        <div className="text-center mb-4">
          <FaParking size={50} color="#00d2ff" className="mb-3" />
          <h2 className="fw-bold text-white">Create Account</h2>
          <p className="text-muted">Join SUPRS Smart Parking</p>
        </div>
        {(err || mutation.isError) && <Alert variant="danger">{err}</Alert>}
        <Form onSubmit={handleSubmit}>
          {[
            { icon: <FaUser />, type: 'email', placeholder: 'Email Address', key: 'email' },
            { icon: <FaLock />, type: 'password', placeholder: 'Password', key: 'password' },
            { icon: <FaLock />, type: 'password', placeholder: 'Confirm Password', key: 'confirm' },
          ].map(({ icon, type, placeholder, key }) => (
            <div key={key} style={{ position: 'relative', marginBottom: '1.2rem' }}>
              <span style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }}>{icon}</span>
              <Form.Control type={type} placeholder={placeholder}
                value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                required style={{ paddingLeft: 45, background: 'rgba(15,23,42,0.6)', border: '1px solid #334155', color: 'white' }} />
            </div>
          ))}
          <Button type="submit" className="w-100 py-3 fw-bold mt-2"
            style={{ background: 'linear-gradient(45deg,#00d2ff,#3a7bd5)', border: 'none' }}
            disabled={mutation.isPending}> {/* v5 uses isPending not isLoading */}
            {mutation.isPending ? <Spinner animation="border" size="sm" /> : 'CREATE ACCOUNT'}
          </Button>
        </Form>
        <div className="mt-3 text-center">
          <span className="text-muted small">Already have an account? </span>
          <Link to="/login" style={{ color: '#00d2ff' }}>Sign In</Link>
        </div>
      </Card>
    </Wrapper>
  );
}