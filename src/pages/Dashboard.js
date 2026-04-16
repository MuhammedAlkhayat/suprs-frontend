import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from 'react-bootstrap';
import { gsap } from 'gsap';
import { FaParking, FaCarSide, FaClock, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';
import styled from 'styled-components';

const GlassCard = styled.div`
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px; padding: 2rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
`;

const StatCard = styled.div`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 1.2rem;
  display: flex; align-items: center; gap: 14px;
`;

const SlotCard = styled.div`
  background: ${p => p.$bg};
  border: 2px solid ${p => p.$border};
  border-radius: 16px; padding: 16px 12px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: ${p => p.$clickable ? 'pointer' : 'not-allowed'};
  transition: transform 0.2s, box-shadow 0.2s;
  min-height: 150px; justify-content: center;
  &:hover {
    transform: ${p => p.$clickable ? 'translateY(-6px)' : 'none'};
    box-shadow: ${p => p.$clickable ? `0 12px 24px ${p.$border}44` : 'none'};
  }
`;

const statusCfg = {
  AVAILABLE: { bg: 'rgba(34,197,94,0.12)',  border: '#22c55e', color: '#22c55e' },
  OCCUPIED:  { bg: 'rgba(239,68,68,0.12)',   border: '#ef4444', color: '#ef4444' },
  RESERVED:  { bg: 'rgba(234,179,8,0.12)',   border: '#eab308', color: '#eab308' },
};

function formatDuration(since) {
  if (!since) return '';
  const mins = Math.floor((Date.now() - new Date(since)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const { data: slots = [], isLoading, isError } = useQuery({
    queryKey: ['slots'],
    queryFn: () => api.get('/slots').then(r => r.data),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!containerRef.current || isLoading) return;
    gsap.fromTo(containerRef.current,
      { y: 30, opacity: 0 },
      { duration: 0.7, y: 0, opacity: 1, ease: 'power3.out' }
    );
  }, [isLoading]);

  const available = slots.filter(s => s.status === 'AVAILABLE').length;
  const occupied  = slots.filter(s => s.status === 'OCCUPIED').length;
  const reserved  = slots.filter(s => s.status === 'RESERVED').length;

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Spinner animation="border" style={{ color: '#00d2ff', width: 48, height: 48 }} />
    </div>
  );

  if (isError) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>
      <p>Failed to load parking data. Please check your connection.</p>
    </div>
  );

  return (
    <div ref={containerRef}>
      {/* Page Title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.8rem', color: '#00d2ff', marginBottom: 4 }}>
          🅿️ SUPRS Smart Map
        </h1>
        <p style={{ color: '#64748b', margin: 0 }}>Real-time parking availability — click any green slot to book</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { count: available, label: 'Available', color: '#22c55e', icon: <FaCheckCircle size={20} />, bg: 'rgba(34,197,94,0.15)' },
          { count: occupied,  label: 'Occupied',  color: '#ef4444', icon: <FaCarSide size={20} />,    bg: 'rgba(239,68,68,0.15)' },
          { count: reserved,  label: 'Reserved',  color: '#eab308', icon: <FaClock size={20} />,      bg: 'rgba(234,179,8,0.15)' },
          { count: slots.length, label: 'Total',  color: '#00d2ff', icon: <FaParking size={20} />,   bg: 'rgba(0,210,255,0.15)' },
        ].map(s => (
          <StatCard key={s.label}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          </StatCard>
        ))}
      </div>

      {/* Slot Grid */}
      <GlassCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <h4 style={{ margin: 0, fontWeight: 700, color: '#f8fafc' }}>Parking Lot — Live View</h4>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
            <span><span style={{ color: '#22c55e' }}>●</span> Available</span>
            <span><span style={{ color: '#ef4444' }}>●</span> Occupied</span>
            <span><span style={{ color: '#eab308' }}>●</span> Reserved</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
          {slots.map(slot => {
            const cfg = statusCfg[slot.status] || statusCfg.AVAILABLE;
            const isAvailable = slot.status === 'AVAILABLE';
            return (
              <SlotCard
                key={slot.id}
                $bg={cfg.bg} $border={cfg.border} $clickable={isAvailable}
                onClick={() => isAvailable && navigate('/booking', { state: { selectedSlot: slot } })}
                role={isAvailable ? 'button' : undefined}
                aria-label={`Slot ${slot.slot_number} - ${slot.status}`}
              >
                {slot.status === 'AVAILABLE' && <FaParking size={32} color="#22c55e" />}
                {slot.status === 'OCCUPIED'  && <FaCarSide size={32} color="#ef4444" />}
                {slot.status === 'RESERVED'  && <FaParking size={32} color="#eab308" />}

                <div style={{ fontWeight: 800, fontSize: 16, color: '#f8fafc' }}>{slot.slot_number}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: cfg.color, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {slot.status}
                </div>

                {slot.status === 'OCCUPIED' && slot.occupied_since && (
                  <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 2 }}>
                    <div><FaClock size={9} /> {formatDuration(slot.occupied_since)}</div>
                    {slot.occupant_email && (
                      <div style={{ marginTop: 2 }}>👤 {slot.occupant_email.split('@')[0]}</div>
                    )}
                  </div>
                )}

                {isAvailable && (
                  <div style={{ fontSize: 11, color: '#00d2ff', marginTop: 2, fontWeight: 600 }}>
                    ${slot.price_per_hour || 5}/hr
                  </div>
                )}
              </SlotCard>
            );
          })}
        </div>

        {slots.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
            No parking slots found. Ask admin to add slots.
          </div>
        )}
      </GlassCard>
    </div>
  );
}