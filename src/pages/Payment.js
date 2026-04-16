import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { useToast } from '../components/ToastProvider';
import api from '../services/api';
import {
  FaCreditCard, FaLock, FaCheckCircle,
  FaShieldAlt, FaArrowLeft, FaCalendarAlt,
} from 'react-icons/fa';
import { SiVisa, SiMastercard } from 'react-icons/si';

// ── Animated card preview ─────────────────────────────────
function CardPreview({ number, holder, expiry, isFlipped }) {
  const fmt = (n) => {
    const clean = n.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim() || '•••• •••• •••• ••••';
  };

  return (
    <div style={{ perspective: 1000, marginBottom: 24 }}>
      <div style={{
        position: 'relative', width: '100%', height: 170,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          background: 'linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)',
          borderRadius: 18, padding: '22px 24px',
          border: '1px solid rgba(0,210,255,0.2)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 160, height: 160, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(0,210,255,0.12),transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              width: 40, height: 28, borderRadius: 5,
              background: 'linear-gradient(135deg,#f59e0b,#d97706)',
            }} />
            <SiVisa size={26} color="rgba(255,255,255,0.85)" />
          </div>
          <div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 17, fontWeight: 700, letterSpacing: 2.5,
              color: 'rgba(255,255,255,0.9)', marginBottom: 14,
            }}>
              {fmt(number)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Card Holder
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', marginTop: 2 }}>
                  {holder || 'YOUR NAME'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Expires
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
                  {expiry || 'MM/YY'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',
          borderRadius: 18, border: '1px solid rgba(0,210,255,0.2)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden',
        }}>
          <div style={{ height: 40, background: '#1e293b', margin: '22px 0 18px' }} />
          <div style={{ padding: '0 24px' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>
              CVV
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 5,
              padding: '9px 12px', fontFamily: "'Courier New', monospace",
              fontSize: 15, letterSpacing: 4, color: 'rgba(255,255,255,0.7)',
              textAlign: 'right',
            }}>
              •••
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Luhn check (basic card validation) ───────────────────
function luhn(num) {
  let sum = 0, alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

function detectCard(num) {
  if (/^4/.test(num)) return 'visa';
  if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
  return 'unknown';
}

// ── Main Payment page ─────────────────────────────────────
export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const wrapRef = useRef(null);

  const { total, slotCode, slotId, bookingId, duration } = location.state || {};

  const [form, setForm] = useState({
    holder: '', number: '', expiry: '', cvv: '',
  });
  const [isFlipped,  setIsFlipped]  = useState(false);
  const [cardType,   setCardType]   = useState('unknown');
  const [errors,     setErrors]     = useState({});
  const [succeeded,  setSucceeded]  = useState(false);

  useEffect(() => {
    if (!bookingId) { navigate('/dashboard'); return; }
    if (!wrapRef.current) return;
    gsap.fromTo(wrapRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    );
  }, [bookingId, navigate]);

  // Format card number with spaces
  const handleNumber = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const fmt = raw.replace(/(.{4})/g, '$1 ').trim();
    setForm(f => ({ ...f, number: raw }));
    setCardType(detectCard(raw));
    e.target.value = fmt;
  };

  // Format expiry MM/YY
  const handleExpiry = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    setForm(f => ({ ...f, expiry: v }));
    e.target.value = v;
  };

  const validate = () => {
    const errs = {};
    if (!form.holder.trim())           errs.holder = 'Name required';
    if (form.number.length < 16)       errs.number = 'Enter full 16-digit number';
    else if (!luhn(form.number))       errs.number = 'Invalid card number';
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) errs.expiry = 'Format: MM/YY';
    else {
      const [mm, yy] = form.expiry.split('/').map(Number);
      const now = new Date();
      const exp = new Date(2000 + yy, mm - 1);
      if (exp < now) errs.expiry = 'Card expired';
    }
    if (form.cvv.length < 3) errs.cvv = 'Enter CVV';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const payMutation = useMutation({
    mutationFn: () =>
      api.post('/payments/confirm', {
        bookingId,
        amount: total,
        method: cardType === 'mastercard' ? 'MASTERCARD' : 'VISA',
        last4: form.number.slice(-4),
      }).then(r => r.data),
    onSuccess: () => {
      setSucceeded(true);
      qc.invalidateQueries({ queryKey: ['slots'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      showToast('Payment Successful! 🎉', `$${total} paid for Slot ${slotCode}`, 'success', 7000);
      gsap.to(wrapRef.current, {
        scale: 1.02, duration: 0.15, yoyo: true, repeat: 1,
        onComplete: () => setTimeout(() => navigate('/dashboard'), 2000),
      });
    },
    onError: (err) => {
      showToast('Payment Failed', err.response?.data?.error || 'Please try again.', 'error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    payMutation.mutate();
  };

  if (!bookingId) return null;

  // ── Success screen ──────────────────────────────────────
  if (succeeded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px' }}>
        <div ref={wrapRef} style={{
          textAlign: 'center', maxWidth: 400,
          background: 'rgba(13,27,46,0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 28, padding: '3rem 2rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg,#10b981,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 40px rgba(16,185,129,0.4)',
          }}>
            <FaCheckCircle size={36} color="white" />
          </div>
          <h2 style={{ fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8 }}>
            Payment Successful!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 6 }}>
            Slot <strong style={{ color: '#00d2ff' }}>{slotCode}</strong> confirmed for{' '}
            <strong style={{ color: '#00d2ff' }}>{duration}h</strong>
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Redirecting to dashboard…
          </p>
        </div>
      </div>
    );
  }

  // ── Payment form ────────────────────────────────────────
  return (
    <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
      <div ref={wrapRef} style={{
        width: '100%', maxWidth: 500,
        background: 'rgba(13,27,46,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 28, padding: '2rem',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Top glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg,transparent,rgba(0,210,255,0.5),transparent)',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '8px 10px',
            cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
          }}>
            <FaArrowLeft size={13} />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 900, margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              Secure Payment
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FaShieldAlt size={10} color="#10b981" /> SSL Encrypted
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <SiVisa size={28} color={cardType === 'visa' ? '#fff' : 'rgba(255,255,255,0.25)'} style={{ transition: 'color 0.2s' }} />
            <SiMastercard size={28} color={cardType === 'mastercard' ? '#fff' : 'rgba(255,255,255,0.25)'} style={{ transition: 'color 0.2s' }} />
          </div>
        </div>

        {/* Card preview */}
        <CardPreview
          number={form.number}
          holder={form.holder}
          expiry={form.expiry}
          isFlipped={isFlipped}
        />

        {/* Order summary */}
        <div style={{
          padding: '12px 16px', borderRadius: 14, marginBottom: 20,
          background: 'rgba(0,210,255,0.04)',
          border: '1px solid rgba(0,210,255,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            🅿️ Slot <strong style={{ color: '#00d2ff' }}>{slotCode}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>· {duration}h</span>
          </div>
          <div style={{
            fontSize: '1.4rem', fontWeight: 900,
            background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            ${Number(total).toFixed(2)}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Cardholder */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Cardholder Name
            </label>
            <div style={{ position: 'relative' }}>
              <FaCreditCard size={13} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: '#00d2ff',
              }} />
              <input
                type="text"
                placeholder="Mohammed Al-Khayyat"
                value={form.holder}
                onChange={e => setForm(f => ({ ...f, holder: e.target.value }))}
                style={{
                  width: '100%', padding: '12px 12px 12px 34px',
                  background: 'rgba(15,23,42,0.8)',
                  border: `1px solid ${errors.holder ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10, color: 'white', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            {errors.holder && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.holder}</div>}
          </div>

          {/* Card number */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Card Number
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              onChange={handleNumber}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(15,23,42,0.8)',
                border: `1px solid ${errors.number ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10, color: 'white', fontSize: 15,
                fontFamily: "'Courier New', monospace", letterSpacing: 2,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {errors.number && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.number}</div>}
          </div>

          {/* Expiry + CVV */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Expiry Date
              </label>
              <div style={{ position: 'relative' }}>
                <FaCalendarAlt size={12} style={{
                  position: 'absolute', left: 11, top: '50%',
                  transform: 'translateY(-50%)', color: '#00d2ff',
                }} />
                <input
                  type="text"
                  placeholder="MM/YY"
                  maxLength={5}
                  onChange={handleExpiry}
                  style={{
                    width: '100%', padding: '12px 12px 12px 30px',
                    background: 'rgba(15,23,42,0.8)',
                    border: `1px solid ${errors.expiry ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10, color: 'white', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              {errors.expiry && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.expiry}</div>}
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                CVV
              </label>
              <input
                type="password"
                placeholder="•••"
                maxLength={4}
                onFocus={() => setIsFlipped(true)}
                onBlur={() => setIsFlipped(false)}
                onChange={e => setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '') }))}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'rgba(15,23,42,0.8)',
                  border: `1px solid ${errors.cvv ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10, color: 'white', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              {errors.cvv && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.cvv}</div>}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={payMutation.isPending}
            style={{
              width: '100%', padding: '15px',
              borderRadius: 16, border: 'none',
              fontWeight: 800, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: payMutation.isPending
                ? 'rgba(0,210,255,0.3)'
                : 'linear-gradient(135deg,#00d2ff,#3a7bd5)',
              color: '#001219',
              cursor: payMutation.isPending ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(0,210,255,0.3)',
              transition: 'all 0.25s',
            }}>
            {payMutation.isPending ? (
              <>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid rgba(0,18,25,0.3)',
                  borderTopColor: '#001219',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Processing…
              </>
            ) : (
              <><FaLock size={13} /> Pay ${Number(total).toFixed(2)}</>
            )}
          </button>

          {/* Trust badges */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14,
            paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)',
            flexWrap: 'wrap',
          }}>
            {['🔒 SSL Secured', '✅ Instant Confirm', '🚫 No Data Stored'].map(b => (
              <span key={b} style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{b}</span>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}