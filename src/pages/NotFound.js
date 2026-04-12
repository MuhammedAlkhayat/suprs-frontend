import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';

export default function NotFound() {
  const history = useHistory();
  return (
    <Container className="text-center py-5">
      <h1 style={{ fontSize: '6rem', color: '#00d2ff' }}>404</h1>
      <h3>Oops! Page not found.</h3>
      <Button className="mt-4" onClick={() => history.push('/dashboard')}>Back to Dashboard</Button>
    </Container>
  );
}