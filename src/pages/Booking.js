import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Spinner } from 'react-bootstrap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { FaClock, FaTicketAlt, FaArrowRight, FaParking, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import { bookSlot } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const Card = styled.div`
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px; padding: 2.5rem;
  max-width: 560px; margin: 0 auto;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
`;

const PriceTag = styled.div`
  font-size: 3rem; font-weight: 800;
  color: #00d2ff;
  text-shadow: 0 0 20px rgba(0,210,255,0.4);
`;

const PayBtn = styled.button`
  width: 100%; padding: 14px !important;
  border-radius: 14px !important; border: none !important;
  font-weight: 700 !important; font-size: 15px !important;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s !important;
  &:hover:not(:disabled) { transform: translateY(-2px) !important; }
  &:disabled { opacity: 0.5 !important; cursor: not-allowed; }
`;

const RangeInput = styled.input`
  width: 100%;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #00d2ff ${p => ((p.value - 1) / 23) * 100}%, rgba(255,255,255,0.1) 0%);
  outline: none;
  border: none !important;
  padding: 0 !important;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: #00d2ff;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(0,210,255,0.5);
  }
`;

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const cardRef = useRef(null);
  const [hours, setHours] = useState(1);
  const [payMethod, setPayMethod] = useState('GATE'); // 'GATE' | 'CARD'

  const slot = location.state?.selectedSlot;

  useEffect(() => {
    if (!slot) { navigate('/dashboard'); return; }
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { x: -60, opacity: 0 },
      { duration: 0.7, x: 0, opacity: 1, ease: 'power3.out' }
    );
  }, []);

  const pricePerHour = slot?.price_per_hour || 5;
  const total = +(hours * pricePerHour).toFixed(2);

  const mutation = useMutation({
    mutationFn: bookSlot,
    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: ['slots'] });
      if (payMethod === 'CARD') {
        navigate('/payment', { state: { total, slotCode: slot.slot_number, slotId: slot.id, bookingId: booking.booking_id } });
      } else {
        navigate('/dashboard', { state: { success: `Slot ${slot.slot_number} booked! Pay at gate.` } });
      }
    },
  });

  const handleConfirm = () => {
    if (!user) { navigate('/login'); return; }
    mutation.mutate({
      slot_id: slot.id,
      duration_hours: hours,
      total_amount: total,
      payment_method: payMethod === 'GATE' ? 'CASH' : 'VISA',
    });
  };

  if (!slot) return null;

  return (
    <div style={{ padding: '20px 0' }}>
      <Card ref={cardRef}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FaTicketAlt size={28} color="#001219" />
          </div>
          <h2 style={{ fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>Confirm Reservation</h2>
          <p style={{ color: '#64748b', margin: 0 }}>
            Slot <span style={{ color: '#00d2ff', fontWeight: 700 }}>{slot.slot_number}</span>
            {' · '}${pricePerHour}/hr
          </p>
        </div>

        {/* Duration Slider */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaClock size={13} /> Select Duration
          </label>
          <RangeInput type="range" min="1" max="24" value={hours}
            onChange={e => setHours(Number(e.target.value))} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, color: '#64748b' }}>
            <span>1 hr</span>
            <span style={{ color: '#00d2ff', fontWeight: 700 }}>{hours} {hours === 1 ? 'Hour' : 'Hours'}</span>
            <span>24 hrs</span>
          </div>
        </div>

        {/* Price */}
        <div style={{ textAlign: 'center', marginBottom: 28, padding: '20px', background: 'rgba(0,210,255,0.05)', borderRadius: 16, border: '1px solid rgba(0,210,255,0.1)' }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Total Estimated Price</div>
          <PriceTag>${total.toFixed(2)}</PriceTag>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{hours} hr × ${pricePerHour}/hr</div>
        </div>

        {/* Payment Method */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>Payment Method</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'GATE', icon: <FaMoneyBillWave size={18} />, label: 'Pay at Gate', sub: 'Cash / Card on arrival' },
              { key: 'CARD', icon: <FaCreditCard size={18} />,    label: 'Pay Online',  sub: 'Visa / Mastercard' },
            ].map(m => (
              <div key={m.key}
                onClick={() => setPayMethod(m.key)}
                style={{
                  padding: '14px 12px', borderRadius: 14, cursor: 'pointer',
                  border: `2px solid ${payMethod === m.key ? '#00d2ff' : 'rgba(255,255,255,0.08)'}`,
                  background: payMethod === m.key ? 'rgba(0,210,255,0.08)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
                }}>
                <div style={{ color: payMethod === m.key ? '#00d2ff' : '#64748b' }}>{m.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: payMethod === m.key ? '#f8fafc' : '#94a3b8' }}>{m.label}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {mutation.isError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
            {mutation.error?.response?.data?.error || 'Booking failed. Slot may no longer be available.'}
          </div>
        )}

        <PayBtn
          onClick={handleConfirm}
          disabled={mutation.isPending}
          style={{ background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)', color: 'white' }}
        >
          {mutation.isPending
            ? <><Spinner animation="border" size="sm" /> Processing...</>
            : <>{payMethod === 'CARD' ? 'PROCEED TO PAYMENT' : 'CONFIRM BOOKING'} <FaArrowRight /></>
          }
        </PayBtn>

        <button
          onClick={() => navigate('/dashboard')}
          style={{ width: '100%', marginTop: 12, background: 'transparent !important', border: 'none', color: '#64748b', cursor: 'pointer', padding: '10px', fontSize: 14 }}
        >
          ← Cancel and go back
        </button>
      </Card>
    </div>
  );
}