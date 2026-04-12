import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Container, Button, Spinner } from 'react-bootstrap';
import { gsap } from 'gsap';
import { FaCreditCard, FaCheckCircle, FaLock } from 'react-icons/fa';
import api from '../services/api';

const PaymentCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  padding: 3rem;
  max-width: 500px;
  margin: 4rem auto;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
`;

const SuccessIcon = styled(FaCheckCircle)`
  color: #22c55e;
  font-size: 5rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 0 15px rgba(34, 197, 94, 0.4));
`;

export default function Payment() {
  const location = useLocation();
  const history = useHistory();
  const cardRef = useRef(null);
  const successRef = useRef(null);

  const [status, setStatus] = useState('IDLE'); // IDLE, PROCESSING, SUCCESS
  const total = location.state?.total || 0;
  const slotCode = location.state?.slotCode || 'N/A';

  // initial mount animation (defensive)
  useEffect(() => {
    if (!cardRef.current) return;
    const anim = gsap.fromTo(
      cardRef.current,
      { scale: 0.8, opacity: 0 },
      {
        duration: 0.8,
        scale: 1,
        opacity: 1,
        ease: 'back.out(1.7)',
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

  // success animation when status transitions to SUCCESS
  useEffect(() => {
    if (status !== 'SUCCESS' || !successRef.current) return;
    const icon = successRef.current;
    const anim = gsap.fromTo(
      icon,
      { scale: 0, rotation: 180, opacity: 0 },
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'back.out(1.2)',
        onComplete() {
          try { icon.style.opacity = ''; } catch (e) {}
        }
      }
    );

    return () => {
      try {
        if (anim) anim.kill();
        icon.style.opacity = '1';
      } catch (e) {}
    };
  }, [status]);

  const handlePayment = async () => {
    setStatus('PROCESSING');

    // Simulate network delay for professional feel
    setTimeout(async () => {
      try {
        const res = await api.post('/payments', { amount: total, slotCode });
        if (res.data && res.data.success) {
          setStatus('SUCCESS');
        } else {
          throw new Error('Payment failed');
        }
      } catch (err) {
        alert('Payment Failed. Please try again.');
        setStatus('IDLE');
      }
    }, 2000);
  };

  if (status === 'SUCCESS') {
    return (
      <Container>
        <PaymentCard ref={cardRef}>
          <SuccessIcon ref={successRef} />
          <h2 className="fw-bold mb-3">Payment Confirmed!</h2>
          <p className="text-muted mb-4">
            Your reservation for slot <span className="text-white fw-bold">{slotCode}</span> is now active.
          </p>
          <Button variant="primary" className="w-100 py-3" onClick={() => history.push('/dashboard')}>
            RETURN TO MAP
          </Button>
        </PaymentCard>
      </Container>
    );
  }

  return (
    <Container>
      <PaymentCard ref={cardRef}>
        <FaCreditCard size={50} color="#00d2ff" className="mb-4" />
        <h2 className="fw-bold">Secure Checkout</h2>
        <p className="text-muted mb-4">Finalize your booking for {slotCode}</p>

        <div className="bg-dark p-4 rounded-4 mb-4" style={{ border: '1px solid #334155' }}>
          <small className="text-muted d-block mb-1">Amount Due</small>
          <h1 className="fw-bold" style={{ color: '#00d2ff' }}>${total.toFixed(2)}</h1>
        </div>

        <div className="text-start mb-4 small text-muted">
          <p><FaLock className="me-2" /> Encrypted SSL Connection</p>
          <p><FaCheckCircle className="me-2" /> Instant Reservation Activation</p>
        </div>

        <Button
          variant="primary"
          className="w-100 py-3 fw-bold"
          disabled={status === 'PROCESSING'}
          onClick={handlePayment}
        >
          {status === 'PROCESSING' ? (
            <><Spinner animation="border" size="sm" className="me-2" /> AUTHORIZING...</>
          ) : (
            `PAY $${total.toFixed(2)} NOW`
          )}
        </Button>

        <Button variant="link" className="mt-3 text-muted text-decoration-none" onClick={() => history.goBack()}>
          Go back to details
        </Button>
      </PaymentCard>
    </Container>
  );
}