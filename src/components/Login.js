// src/components/Login.js
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { login as apiLogin } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation(apiLogin, {
    onSuccess: (data) => {
      // data: { token, user }
      signIn({ email, password }); // or set token/user using returned data
      navigate('/dashboard');
    },
  });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await mutation.mutateAsync({ email, password });
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} required />
      <label>Password</label>
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
      <button type="submit" disabled={mutation.isLoading}>
        {mutation.isLoading ? 'Signing in...' : 'Sign in'}
      </button>
      {mutation.isError && <div className="error">Login failed</div>}
    </form>
  );
}