import React from 'react';
import { FaParking, FaCarSide, FaClock, FaUser } from 'react-icons/fa';

const statusConfig = {
  AVAILABLE: { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', color: '#22c55e', icon: <FaParking size={28} /> },
  OCCUPIED:  { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', color: '#ef4444', icon: <FaCarSide size={28} /> },
  RESERVED:  { bg: 'rgba(234,179,8,0.15)',  border: '#eab308', color: '#eab308', icon: <FaParking size={28} /> },
};

function formatDuration(since) {
  if (!since) return '';
  const mins = Math.floor((Date.now() - new Date(since)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function SlotGrid({ slots = [], onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
      {slots.map(slot => {
        const cfg = statusConfig[slot.status] || statusConfig.AVAILABLE;
        const isAvailable = slot.status === 'AVAILABLE';
        return (
          <div
            key={slot.id || slot.slot_id}
            onClick={() => isAvailable && onSelect && onSelect(slot)}
            style={{
              background: cfg.bg,
              border: `2px solid ${cfg.border}`,
              borderRadius: 16,
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              cursor: isAvailable ? 'pointer' : 'not-allowed',
              transition: 'transform 0.2s, box-shadow 0.2s',
              userSelect: 'none',
              minHeight: 140,
            }}
            onMouseEnter={e => { if (isAvailable) { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 12px 24px ${cfg.border}44`; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ color: cfg.color }}>{cfg.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#f8fafc' }}>{slot.slot_number}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: cfg.color, textTransform: 'uppercase', letterSpacing: 1 }}>{slot.status}</div>

            {slot.status === 'OCCUPIED' && slot.occupied_since && (
              <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
                  <FaClock size={9} /> {formatDuration(slot.occupied_since)}
                </div>
                {slot.occupant_email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center', marginTop: 2 }}>
                    <FaUser size={9} /> {slot.occupant_email.split('@')[0]}
                  </div>
                )}
              </div>
            )}

            {isAvailable && (
              <div style={{ fontSize: 11, color: '#00d2ff', marginTop: 2 }}>
                ${slot.price_per_hour || 5}/hr
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
