// src/pages/Payment.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // <- changed
import styled from 'styled-components';
import { Container, Button, Spinner } from 'react-bootstrap';
import { gsap } from 'gsap';
import { FaCreditCard, FaCheckCircle, FaLock } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import api from '../services/api';

// Stripe promise (cached)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

// Styled components (kept from your original)
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

/* small wrapper to style CardElement */
const CardWrapper = styled.div`
  background: rgba(0,0,0,0.25);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px solid rgba(255,255,255,0.06);
  .StripeElement {
    color: #fff;
    font-size: 16px;
    font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  }
`;

function PaymentInner() {
  const location = useLocation();
  const navigate = useNavigate(); // <- changed
  const cardRef = useRef(null);
  const successRef = useRef(null);

  const stripe = useStripe();
  const elements = useElements();

  const [status, setStatus] = useState('IDLE'); // IDLE | PROCESSING | SUCCESS
  const total = typeof location.state?.total === 'number' ? location.state.total : (Number(location.state?.amount) || 0);
  const slotCode = location.state?.slotCode || location.state?.slot_code || 'N/A';
  const slotId = location.state?.slotId || location.state?.slot_id || null;

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

  const handlePayment = useCallback(async (e) => {
    e && e.preventDefault();
    if (!stripe || !elements) {
      alert('Payment system not ready. Try again in a moment.');
      return;
    }

    setStatus('PROCESSING');

    try {
      const amountCents = Math.round(total * 100);

      const resp = await api.post('/payments/create-payment-intent', {
        amount: amountCents,
        currency: 'usd',
        metadata: { slot_id: slotId || undefined, slot_code: slotCode || undefined }
      });

      const clientSecret = resp.data?.client_secret || resp?.data?.client_secret || resp?.client_secret;
      if (!clientSecret) throw new Error('Missing client_secret from server');

      const card = elements.getElement(CardElement);
      if (!card) throw new Error('CardElement not found');

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card }
      });

      if (result.error) {
        console.error('Stripe confirm error', result.error);
        alert(result.error.message || 'Payment failed');
        setStatus('IDLE');
        return;
      }

      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        try {
          if (slotId) {
            await api.post('/bookings', { slot_id: slotId, user_id: null });
          }
        } catch (bkErr) {
          console.warn('Booking creation after payment failed', bkErr);
        }

        setStatus('SUCCESS');
      } else {
        throw new Error('Payment not completed');
      }
    } catch (err) {
      console.error('handlePayment error', err);
      alert(err.message || 'Payment failed');
      setStatus('IDLE');
    }
  }, [stripe, elements, total, slotId, slotCode]);

  if (status === 'SUCCESS') {
    return (
      <Container>
        <PaymentCard ref={cardRef}>
          <SuccessIcon ref={successRef} />
          <h2 className="fw-bold mb-3">Payment Confirmed!</h2>
          <p className="text-muted mb-4">
            Your reservation for slot <span className="text-white fw-bold">{slotCode}</span> is now active.
          </p>
          <Button variant="primary" className="w-100 py-3" onClick={() => navigate('/dashboard')}> {/* <- changed */}
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

        <form onSubmit={handlePayment}>
          <CardWrapper>
            <CardElement options={{
              style: {
                base: {
                  color: '#fff',
                  fontSize: '16px',
                  '::placeholder': { color: '#94a3b8' },
                },
                invalid: { color: '#ff6b6b' }
              }
            }} />
          </CardWrapper>

          <Button
            variant="primary"
            className="w-100 py-3 fw-bold"
            type="submit"
            disabled={status === 'PROCESSING' || !stripe || !elements}
          >
            {status === 'PROCESSING' ? (
              <><Spinner animation="border" size="sm" className="me-2" /> AUTHORIZING...</>
            ) : (
              `PAY $${total.toFixed(2)} NOW`
            )}
          </Button>
        </form>

        <Button variant="link" className="mt-3 text-muted text-decoration-none" onClick={() => navigate(-1)}> {/* <- changed */}
          Go back to details
        </Button>
      </PaymentCard>
    </Container>
  );
}

// Top-level page component that wraps PaymentInner with Elements
export default function PaymentPageWrapper() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentInner />
    </Elements>
  );
}