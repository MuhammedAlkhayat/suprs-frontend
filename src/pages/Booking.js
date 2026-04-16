import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import {
  FaClock, FaTicketAlt, FaArrowRight, FaMoneyBillWave,
  FaCreditCard, FaMapMarkerAlt, FaInfoCircle, FaStar,
  FaShieldAlt, FaCheckCircle, FaParking,
} from 'react-icons/fa';
import { bookSlot } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';

/* ── helpers ─────────────────────────────────────────────────── */
function formatDuration(h) {
  if (h < 1)  return `${Math.round(h * 60)} min`;
  if (h === 1) return '1 Hour';
  if (h < 24)  return `${h} Hours`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

function PriceBreakdown({ hours, pricePerHour }) {
  const subtotal = +(hours * pricePerHour).toFixed(2);
  const tax      = +(subtotal * 0.05).toFixed(2);
  const total    = +(subtotal + tax).toFixed(2);

  return { subtotal, tax, total };
}

/* ── Animated price counter ──────────────────────────────────── */
function AnimatedPrice({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const start = prev.current;
    const end   = value;
    const diff  = end - start;
    const steps = 20;
    let step = 0;
    const id = setInterval(() => {
      step++;
      setDisplay(+(start + (diff * step) / steps).toFixed(2));
      if (step >= steps) { clearInterval(id); prev.current = end; }
    }, 18);
    return () => clearInterval(id);
  }, [value]);

  return <span>{display.toFixed(2)}</span>;
}

/* ── Step indicator ──────────────────────────────────────────── */
function StepBar({ step }) {
  const steps = ['Select Slot', 'Configure', 'Confirm'];
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, marginBottom:28 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{
              width:28, height:28, borderRadius:'50%',
              background: i < step
                ? 'linear-gradient(135deg,#00d2ff,#3a7bd5)'
                : i === step
                ? 'rgba(0,210,255,0.2)'
                : 'rgba(255,255,255,0.06)',
              border: i === step ? '2px solid #00d2ff' : '2px solid transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:800,
              color: i <= step ? '#00d2ff' : 'var(--text-muted)',
              transition:'all 0.3s',
            }}>
              {i < step ? <FaCheckCircle size={12} color="#001219" /> : i + 1}
            </div>
            <span style={{ fontSize:10, color: i === step ? '#00d2ff' : 'var(--text-muted)',
              fontWeight: i === step ? 700 : 400, whiteSpace:'nowrap' }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              height:2, width:48, margin:'0 4px', marginBottom:16,
              background: i < step
                ? 'linear-gradient(90deg,#00d2ff,#3a7bd5)'
                : 'rgba(255,255,255,0.06)',
              borderRadius:2, transition:'background 0.4s',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user }  = useAuth();
  const qc        = useQueryClient();
  const { showToast } = useToast();

  const cardRef    = useRef(null);
  const priceRef   = useRef(null);

  const [hours, setHours]         = useState(1);
  const [payMethod, setPayMethod] = useState('GATE');
  const [step, setStep]           = useState(1);
  const [confirmed, setConfirmed] = useState(false);

  const slot = location.state?.selectedSlot;

  /* redirect if no slot passed */
  useEffect(() => {
    if (!slot) { navigate('/dashboard'); return; }
  }, [slot, navigate]);

  /* entrance animation */
  useEffect(() => {
    if (!cardRef.current || !slot) return;
    gsap.fromTo(cardRef.current,
      { y: 40, opacity: 0, scale: 0.97 },
      { duration: 0.65, y: 0, opacity: 1, scale: 1, ease: 'power3.out' }
    );
  }, [slot]);

  /* price flash on duration change */
  useEffect(() => {
    if (!priceRef.current) return;
    gsap.fromTo(priceRef.current,
      { scale: 1.08, color: '#00d2ff' },
      { scale: 1, duration: 0.3, ease: 'power2.out' }
    );
  }, [hours]);

  if (!slot) return null;

  const pricePerHour = slot?.price_per_hour || 5;
  const { subtotal, tax, total } = PriceBreakdown({ hours, pricePerHour });

  const mutation = useMutation({
    mutationFn: bookSlot,
    onSuccess: (booking) => {
      setConfirmed(true);
      qc.invalidateQueries({ queryKey: ['slots'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });

      gsap.to(cardRef.current, {
        scale: 1.02, duration: 0.15, yoyo: true, repeat: 1,
        onComplete: () => {
          showToast(
            '🎉 Booking Confirmed!',
            `Slot ${slot.slot_number} reserved for ${formatDuration(hours)}`,
            'success',
            6000
          );
          setTimeout(() => {
            if (payMethod === 'CARD') {
              navigate('/payment', {
                state: {
                  total,
                  slotCode: slot.slot_number,
                  slotId: slot.id,
                  bookingId: booking.booking_id,
                  duration: hours,
                },
              });
            } else {
              navigate('/dashboard', {
                state: { success: `Slot ${slot.slot_number} booked! Pay at gate.` },
              });
            }
          }, 800);
        },
      });
    },
    onError: (err) => {
      showToast(
        'Booking Failed',
        err.response?.data?.error || 'Slot may no longer be available.',
        'error'
      );
    },
  });

  const handleConfirm = () => {
    if (!user) { navigate('/login'); return; }
    mutation.mutate({
      slot_id:        slot.id,
      duration_hours: hours,
      total_amount:   total,
      payment_method: payMethod === 'GATE' ? 'CASH' : 'VISA',
    });
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ padding:'20px 0', minHeight:'80vh', display:'flex', alignItems:'flex-start', justifyContent:'center' }}>
      <div ref={cardRef} style={{
        width:'100%', maxWidth:580,
        background:'rgba(13,27,46,0.88)',
        backdropFilter:'blur(24px) saturate(180%)',
        WebkitBackdropFilter:'blur(24px) saturate(180%)',
        border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:28,
        padding:'2rem',
        boxShadow:'0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,210,255,0.06)',
        position:'relative',
        overflow:'hidden',
      }}>

        {/* Top glow line */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:1,
          background:'linear-gradient(90deg,transparent,rgba(0,210,255,0.4),transparent)',
        }} />

        {/* Step bar */}
        <StepBar step={step} />

        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{
            width:64, height:64,
            background:'linear-gradient(135deg,#00d2ff,#3a7bd5)',
            borderRadius:18, display:'flex', alignItems:'center',
            justifyContent:'center', margin:'0 auto 14px',
            boxShadow:'0 8px 32px rgba(0,210,255,0.3)',
            animation:'logo-glow 3s ease-in-out infinite',
          }}>
            <FaTicketAlt size={26} color="#001219" />
          </div>
          <h2 style={{ fontWeight:900, color:'var(--text-primary)', marginBottom:4, fontSize:'1.4rem' }}>
            Confirm Reservation
          </h2>
          <p style={{ color:'var(--text-muted)', margin:0, fontSize:13 }}>
            Review your booking details below
          </p>
        </div>

        {/* ── Slot info card ──────────────────────────────── */}
        <div style={{
          display:'flex', alignItems:'center', gap:14,
          padding:'14px 16px', borderRadius:16,
          background:'rgba(0,210,255,0.06)',
          border:'1px solid rgba(0,210,255,0.15)',
          marginBottom:22,
        }}>
          <div style={{
            width:48, height:48, borderRadius:12,
            background:'linear-gradient(135deg,rgba(0,210,255,0.2),rgba(58,123,213,0.2))',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <FaParking size={22} color="#00d2ff" />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:16, color:'var(--text-primary)', marginBottom:2 }}>
              Slot <span style={{ color:'#00d2ff' }}>{slot.slot_number}</span>
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <FaMapMarkerAlt size={10} /> Level {slot.level || 'G'}
              </span>
              <span>·</span>
              <span>${pricePerHour}/hr</span>
              {slot.type && <><span>·</span><span>{slot.type}</span></>}
            </div>
          </div>
          <div style={{
            padding:'4px 10px', borderRadius:99,
            background:'rgba(16,185,129,0.15)',
            border:'1px solid rgba(16,185,129,0.3)',
            fontSize:11, fontWeight:700, color:'#10b981',
          }}>
            AVAILABLE
          </div>
        </div>

        {/* ── Duration Slider ─────────────────────────────── */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <label style={{ color:'var(--text-secondary)', fontSize:13, fontWeight:600,
              display:'flex', alignItems:'center', gap:6 }}>
              <FaClock size={12} color="#00d2ff" /> Duration
            </label>
            <span style={{ fontSize:13, fontWeight:800, color:'#00d2ff',
              background:'rgba(0,210,255,0.1)', padding:'3px 10px',
              borderRadius:99, border:'1px solid rgba(0,210,255,0.2)' }}>
              {formatDuration(hours)}
            </span>
          </div>

          {/* Custom range */}
          <input
            type="range" min="1" max="24" step="1" value={hours}
            onChange={e => { setHours(Number(e.target.value)); setStep(2); }}
            style={{
              width:'100%', WebkitAppearance:'none', appearance:'none',
              height:6, borderRadius:3, outline:'none',
              border:'none', padding:0,
              background:`linear-gradient(to right, #00d2ff ${((hours-1)/23)*100}%, rgba(255,255,255,0.1) 0%)`,
              cursor:'pointer',
            }}
          />

          {/* Hour quick-picks */}
          <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
            {[1, 2, 3, 6, 12, 24].map(h => (
              <button
                key={h}
                onClick={() => { setHours(h); setStep(2); }}
                style={{
                  padding:'5px 12px', borderRadius:99, fontSize:12, fontWeight:700,
                  background: hours === h
                    ? 'linear-gradient(135deg,#00d2ff,#3a7bd5)'
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${hours === h ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                  color: hours === h ? '#001219' : 'var(--text-muted)',
                  cursor:'pointer', transition:'all 0.2s',
                  transform: hours === h ? 'scale(1.05)' : 'scale(1)',
                }}>
                {h}h
              </button>
            ))}
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6,
            fontSize:11, color:'var(--text-muted)' }}>
            <span>1 hr (min)</span>
            <span>24 hrs (max)</span>
          </div>
        </div>

        {/* ── Price Breakdown ─────────────────────────────── */}
        <div ref={priceRef} style={{
          marginBottom:22, padding:'18px 20px',
          background:'rgba(0,210,255,0.04)',
          borderRadius:18, border:'1px solid rgba(0,210,255,0.1)',
        }}>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12,
            fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px' }}>
            Price Breakdown
          </div>

          {[
            { label:`${hours} hr${hours>1?'s':''} × $${pricePerHour}/hr`, value: subtotal },
            { label:'Service fee (5%)', value: tax },
          ].map(row => (
            <div key={row.label} style={{ display:'flex', justifyContent:'space-between',
              marginBottom:8, fontSize:13, color:'var(--text-secondary)' }}>
              <span>{row.label}</span>
              <span>${row.value.toFixed(2)}</span>
            </div>
          ))}

          <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'10px 0' }} />

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>Total</span>
            <div style={{ textAlign:'right' }}>
              <div style={{
                fontSize:'2.2rem', fontWeight:900, lineHeight:1,
                background:'linear-gradient(135deg,#00d2ff,#3a7bd5)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                backgroundClip:'text',
                textShadow:'none',
                filter:'drop-shadow(0 0 12px rgba(0,210,255,0.3))',
              }}>
                $<AnimatedPrice value={total} />
              </div>
              <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>
                SAR {(total * 3.75).toFixed(2)} approx.
              </div>
            </div>
          </div>
        </div>

        {/* ── Payment Method ──────────────────────────────── */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:10,
            fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
            <FaShieldAlt size={12} color="#00d2ff" /> Payment Method
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              {
                key:  'GATE',
                icon: <FaMoneyBillWave size={20} />,
                label:'Pay at Gate',
                sub:  'Cash / Card on arrival',
                badge: null,
              },
              {
                key:  'CARD',
                icon: <FaCreditCard size={20} />,
                label:'Pay Online',
                sub:  'Visa / Mastercard',
                badge: '🔒 Secure',
              },
            ].map(m => {
              const active = payMethod === m.key;
              return (
                <div key={m.key}
                  onClick={() => { setPayMethod(m.key); setStep(2); }}
                  style={{
                    padding:'14px 12px', borderRadius:16, cursor:'pointer',
                    border:`2px solid ${active ? '#00d2ff' : 'rgba(255,255,255,0.07)'}`,
                    background: active
                      ? 'linear-gradient(135deg,rgba(0,210,255,0.1),rgba(58,123,213,0.06))'
                      : 'rgba(255,255,255,0.02)',
                    transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    display:'flex', flexDirection:'column', alignItems:'center',
                    gap:6, textAlign:'center', position:'relative',
                    boxShadow: active ? '0 0 20px rgba(0,210,255,0.12)' : 'none',
                  }}>
                  {m.badge && (
                    <div style={{
                      position:'absolute', top:6, right:6,
                      fontSize:9, fontWeight:700, color:'#10b981',
                      background:'rgba(16,185,129,0.12)',
                      border:'1px solid rgba(16,185,129,0.2)',
                      borderRadius:99, padding:'1px 6px',
                    }}>
                      {m.badge}
                    </div>
                  )}
                  <div style={{ color: active ? '#00d2ff' : 'var(--text-muted)',
                    transition:'color 0.2s' }}>
                    {m.icon}
                  </div>
                  <div style={{ fontWeight:700, fontSize:13,
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition:'color 0.2s' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{m.sub}</div>
                  {active && (
                    <div style={{ position:'absolute', bottom:6,
                      width:20, height:3, borderRadius:99,
                      background:'linear-gradient(90deg,#00d2ff,#3a7bd5)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Summary row ─────────────────────────────────── */}
        <div style={{
          display:'flex', gap:8, flexWrap:'wrap', marginBottom:20,
          padding:'12px 14px', borderRadius:12,
          background:'rgba(255,255,255,0.02)',
          border:'1px solid rgba(255,255,255,0.05)',
        }}>
          {[
            { icon:'🅿️', text:`Slot ${slot.slot_number}` },
            { icon:'⏱️', text: formatDuration(hours) },
            { icon:'💳', text: payMethod === 'CARD' ? 'Online Pay' : 'Pay at Gate' },
            { icon:'💰', text:`$${total}` },
          ].map(item => (
            <div key={item.text} style={{
              display:'flex', alignItems:'center', gap:5,
              fontSize:12, color:'var(--text-secondary)',
              background:'rgba(255,255,255,0.04)',
              padding:'4px 10px', borderRadius:99,
              border:'1px solid rgba(255,255,255,0.06)',
            }}>
              <span>{item.icon}</span>
              <span style={{ fontWeight:600 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* ── Error ───────────────────────────────────────── */}
        {mutation.isError && (
          <div style={{
            background:'rgba(239,68,68,0.08)',
            border:'1px solid rgba(239,68,68,0.25)',
            borderRadius:12, padding:'10px 14px',
            color:'#fca5a5', fontSize:13,
            marginBottom:16, textAlign:'center',
            display:'flex', alignItems:'center', gap:8, justifyContent:'center',
          }}>
            <FaInfoCircle size={13} />
            {mutation.error?.response?.data?.error || 'Booking failed. Slot may no longer be available.'}
          </div>
        )}

        {/* ── Confirm button ──────────────────────────────── */}
        <button
          onClick={() => { setStep(3); handleConfirm(); }}
          disabled={mutation.isPending || confirmed}
          style={{
            width:'100%', padding:'15px',
            borderRadius:16, border:'none',
            fontWeight:800, fontSize:15,
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            background: confirmed
              ? 'linear-gradient(135deg,#10b981,#059669)'
              : 'linear-gradient(135deg,#00d2ff,#3a7bd5)',
            color: '#001219',
            cursor: mutation.isPending || confirmed ? 'not-allowed' : 'pointer',
            opacity: mutation.isPending ? 0.8 : 1,
            transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: confirmed
              ? '0 8px 24px rgba(16,185,129,0.35)'
              : '0 8px 24px rgba(0,210,255,0.3)',
            transform: mutation.isPending ? 'scale(0.99)' : 'scale(1)',
          }}>
          {mutation.isPending ? (
            <><Spinner animation="border" size="sm" style={{ borderColor:'#001219', borderRightColor:'transparent' }} />
              Processing…</>
          ) : confirmed ? (
            <><FaCheckCircle size={16} /> Confirmed!</>
          ) : (
            <>{payMethod === 'CARD' ? '🔒 Proceed to Payment' : '✅ Confirm Booking'}
              <FaArrowRight size={14} /></>
          )}
        </button>

        {/* ── Cancel ──────────────────────────────────────── */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            width:'100%', marginTop:10,
            background:'transparent', border:'none',
            color:'var(--text-muted)', cursor:'pointer',
            padding:'10px', fontSize:13, fontWeight:500,
            transition:'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color='var(--text-secondary)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
          ← Cancel and go back
        </button>

        {/* Trust badges */}
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:16,
          paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          {['🔒 SSL Secured', '✅ Instant Confirmation', '📧 Email Receipt'].map(b => (
            <span key={b} style={{ fontSize:10, color:'var(--text-muted)', fontWeight:500 }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}