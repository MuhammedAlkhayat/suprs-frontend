import React from 'react';

const colorForStatus = (status) => {
  switch (status) {
    case 'AVAILABLE': return '#28a745';
    case 'OCCUPIED': return '#dc3545';
    case 'RESERVED': return '#ffc107';
    default: return '#6c757d';
  }
};

export default function SlotGrid({ slots = [], onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {slots.map(slot => (
        <div
          key={slot.slot_id || slot.id}
          onClick={() => slot.status === 'AVAILABLE' && onSelect(slot)}
          style={{
            width: 120,
            height: 120,
            borderRadius: 12,
            background: colorForStatus(slot.status),
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: slot.status === 'AVAILABLE' ? 'pointer' : 'not-allowed',
            boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
            userSelect: 'none'
          }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{slot.code || slot.slot_code}</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>{slot.status}</div>
        </div>
      ))}
    </div>
  );
}