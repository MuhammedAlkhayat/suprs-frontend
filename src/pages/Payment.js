import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Spinner } from 'react-bootstrap';
import { gsap } from 'gsap';
import { FaCreditCard, FaCheckCircle, FaLock, FaMoneyBillWave, FaShieldAlt } from 'react-icons/fa';
import { SiVisa, SiMastercard } from 'react-icons/si';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const Card = styled.div`
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 28px; padding: 2.5rem;
  max-width: 500px; margin: 0 auto;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
`;

const TabBtn = styled.button`
  flex: 1; padding: 12px !important;
  background: ${p => p.$active ? 'linear-gradient(135deg,#00d2ff,#3a7bd5)' : 'rgba(255,255,255,0.04)'} !important;
  border: 1px solid ${p => p.$active ? 'transparent' : 'rgba(255,255,255,0.08)'} !important;
  border-radius: 12px !important;
  color: ${p => p.$active ? 'white' : '#64748b'} !important;
  font-weight: 600 !important; font-size: 14px !important;
  transition: all 0.2s !important;
  display: flex; align-items: center; justify-content: center; gap: 8px;
`;

const FakeInput = styled.div`
  background: rgba(15,23,42,0.7);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; padding: 14px 16px;
  color: #f8fafc; font-size: 15px; margin-bottom: 12px;
  display: flex; align-items: center; gap: 10px;
  input {
    background: transparent !important;
    border: none !important;
    outline: none;
    color: #f8fafc !important;
    font-size: 15px;
    flex: 1;
    padding: 0 !important;
    &::placeholder { color: #475569; }
  }
`;

const PayBtn = styled.button`
  width: 100%; padding: 16px !important;
  background: linear-gradient(135deg,#00d2ff,#3a7bd5) !important;
  border: none !important; border-radius: 14px !important;
  color: white !important; font-weight: 700 !important; font-size: 16px !important;
  letter-spacing: 1px; margin-top: 8px;
  transition: transform 0.2s, box-shadow 0.2s !important;
  &:hover:not(:disabled) { transform: translateY(-2px) !important; box-shadow: 0 10px 28px rgba(0,210,255,0.35) !important; }
  &:disabled { opacity: 0.5 !important; cursor: not-allowed; }
`;

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const cardRef = useRef(null);
  const [tab, setTab] = useState('card'); // 'card' | 'gate'
  const [status, setStatus] = useState('IDLE'); // IDLE | PROCESSING | SUCCESS
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const total    = Number(location.state?.total) || 0;
  const slotCode = location.state?.slotCode || 'N/A';
  const slotId   = location.state?.slotId || null;
  const bookingId = location.state?.bookingId || null;

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { scale: 0.9, opacity: 0 },
      { duration: 0.6, scale: 1, opacity: 1, ease: 'back.out(1.5)' }
    );
  }, []);

  const gateMutation = useMutation({
    mutationFn: () => api.post('/payments/pay-at-gate', { booking_id: bookingId }),
    onSuccess: () => { setStatus('SUCCESS'); qc.invalidateQueries({ queryKey: ['bookings'] }); },
  });

  const handleCardPay = useCallback(async (e) => {
    e.preventDefault();
    if (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) {
      alert('Please fill in all card details'); return;
    }
    setStatus('PROCESSING');
    try {
      // Simulate card processing (replace with real Stripe when ready)
      await new Promise(r => setTimeout(r, 2000));
      if (bookingId) {
        await api.patch(`/bookings/${bookingId}/payment`, {
          payment_status: 'PAID',
          payment_method: 'VISA',
          total_amount: total,
        });
      }
      qc.invalidateQueries({ queryKey: ['bookings'] });
      setStatus('SUCCESS');
    } catch (err) {
      alert(err?.response?.data?.error || 'Payment failed. Please try again.');
      setStatus('IDLE');
    }
  }, [cardForm, bookingId, total, qc]);

  const handleGatePay = () => {
    if (bookingId) {
      gateMutation.mutate();
    } else {
      setStatus('SUCCESS');
    }
  };

  // ── SUCCESS SCREEN ──────────────────────────────────────────
  if (status === 'SUCCESS') {
    return (
      <div style={{ padding: '20px 0' }}>
        <Card ref={cardRef}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ animation: 'pulse 1s ease-in-out' }}>
              <FaCheckCircle size={80} color="#22c55e" style={{ filter: 'drop-shadow(0 0 20px rgba(34,197,94,0.5))' }} />
            </div>
            <h2 style={{ fontWeight: 800, color: '#f8fafc', marginTop: 20, marginBottom: 8 }}>
              {tab === 'gate' ? 'Booking Confirmed!' : 'Payment Successful!'}
            </h2>
            <p style={{ color: '#64748b', marginBottom: 8 }}>
              Slot <span style={{ color: '#00d2ff', fontWeight: 700 }}>{slotCode}</span> is now reserved for you.
            </p>
            {tab === 'gate' && (
              <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: '#fde68a', fontSize: 13 }}>
                💳 Please pay <strong>${total.toFixed(2)}</strong> at the gate upon arrival.
              </div>
            )}
            {tab === 'card' && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: '#86efac', fontSize: 13 }}>
                ✅ <strong>${total.toFixed(2)}</strong> charged successfully.
              </div>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)', border: 'none', borderRadius: 14, color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              RETURN TO MAP
            </button>
            <button
              onClick={() => navigate('/profile')}
              style={{ width: '100%', marginTop: 10, background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 10, fontSize: 14 }}
            >
              View My Bookings
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ── PAYMENT FORM ────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 0' }}>
      <Card ref={cardRef}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FaCreditCard size={28} color="#001219" />
          </div>
          <h2 style={{ fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>Secure Checkout</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Slot {slotCode}</p>
        </div>

        {/* Amount */}
        <div style={{ background: 'rgba(0,210,255,0.05)', border: '1px solid rgba(0,210,255,0.1)', borderRadius: 16, padding: '16px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Amount Due</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#00d2ff' }}>${total.toFixed(2)}</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <TabBtn $active={tab === 'card'} onClick={() => setTab('card')}>
            <FaCreditCard size={14} /> Pay Online
          </TabBtn>
          <TabBtn $active={tab === 'gate'} onClick={() => setTab('gate')}>
            <FaMoneyBillWave size={14} /> Pay at Gate
          </TabBtn>
        </div>

        {/* Card Form */}
        {tab === 'card' && (
          <form onSubmit={handleCardPay}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <SiVisa size={32} color="#1a1f71" style={{ background: 'white', borderRadius: 4, padding: 4 }} />
              <SiMastercard size={32} />
            </div>

            <FakeInput>
              <FaCreditCard size={14} color="#64748b" />
              <input
                placeholder="Card number (e.g. 4242 4242 4242 4242)"
                value={cardForm.number}
                onChange={e => setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() })}
                maxLength={19}
              />
            </FakeInput>

            <FakeInput>
              <FaLock size={14} color="#64748b" />
              <input
                placeholder="Cardholder name"
                value={cardForm.name}
                onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
              />
            </FakeInput>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FakeInput>
                <input
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChange={e => {
                    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                    setCardForm({ ...cardForm, expiry: v });
                  }}
                  maxLength={5}
                />
              </FakeInput>
              <FakeInput>
                <FaShieldAlt size={14} color="#64748b" />
                <input
                  placeholder="CVV"
                  type="password"
                  value={cardForm.cvv}
                  onChange={e => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  maxLength={4}
                />
              </FakeInput>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: 12, marginBottom: 16 }}>
              <FaLock size={10} /> SSL Encrypted · PCI Compliant
            </div>

            <PayBtn type="submit" disabled={status === 'PROCESSING'}>
              {status === 'PROCESSING'
                ? <><Spinner animation="border" size="sm" /> Authorizing...</>
                : `PAY $${total.toFixed(2)} NOW`
              }
            </PayBtn>
          </form>
        )}

        {/* Gate Payment */}
        {tab === 'gate' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
              <FaMoneyBillWave size={40} color="#eab308" style={{ marginBottom: 12 }} />
              <h4 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: 8 }}>Pay at the Gate</h4>
              <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
                Your slot will be reserved. Pay <strong style={{ color: '#eab308' }}>${total.toFixed(2)}</strong> in cash or card when you arrive at the parking gate.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#64748b', textAlign: 'left' }}>
              <div style={{ marginBottom: 6 }}>✅ Slot reserved immediately</div>
              <div style={{ marginBottom: 6 }}>💳 Cash or card accepted at gate</div>
              <div>⏰ Reservation valid for 30 minutes</div>
            </div>

            <PayBtn onClick={handleGatePay} disabled={gateMutation.isPending}>
              {gateMutation.isPending
                ? <><Spinner animation="border" size="sm" /> Confirming...</>
                : 'CONFIRM — PAY AT GATE'
              }
            </PayBtn>
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          style={{ width: '100%', marginTop: 12, background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 10, fontSize: 14 }}
        >
          ← Go back
        </button>
      </Card>
    </div>
  );
}