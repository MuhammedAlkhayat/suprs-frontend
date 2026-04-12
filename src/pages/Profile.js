import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaUserCircle, FaEnvelope, FaIdBadge } from 'react-icons/fa';

export default function Profile() {
  const user = JSON.parse(localStorage.getItem('user')) || { email: 'Guest', role: 'USER' };

  return (
    <Container className="py-5">
      <div className="glass-card mx-auto" style={{ maxWidth: '600px' }}>
        <div className="text-center mb-4">
          <FaUserCircle size={80} color="#00d2ff" className="mb-3" />
          <h2 className="fw-bold">User Profile</h2>
        </div>
        
        <div className="mb-3 d-flex align-items-center">
          <FaEnvelope className="me-3 text-muted" />
          <div>
            <small className="text-muted d-block">Email Address</small>
            <strong>{user.email}</strong>
          </div>
        </div>

        <div className="mb-4 d-flex align-items-center">
          <FaIdBadge className="me-3 text-muted" />
          <div>
            <small className="text-muted d-block">Account Role</small>
            <span className="badge bg-primary">{user.role}</span>
          </div>
        </div>

        <Button variant="outline-danger" className="w-100" onClick={() => { localStorage.clear(); window.location.href='/login'; }}>
          Sign Out
        </Button>
      </div>
    </Container>
  );
}