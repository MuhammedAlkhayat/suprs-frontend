import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // <- changed

export default function NotFound() {
  const navigate = useNavigate(); // <- changed
  return (
    <Container className="text-center py-5">
      <h1 style={{ fontSize: '6rem', color: '#00d2ff' }}>404</h1>
      <h3>Oops! Page not found.</h3>
      <Button className="mt-4" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </Container>
  );
}