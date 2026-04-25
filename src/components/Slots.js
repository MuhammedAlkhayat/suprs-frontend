// src/components/Slots.js
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getSlots } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import './Slots.css';

export default function Slots() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: slots = [], isLoading, isError, error } = useQuery({
    queryKey: ['slots'],
    queryFn: getSlots,
    staleTime: 5000,
  });

  if (isLoading) return <div className="slots-loading">Loading slots…</div>;
  if (isError) return <div className="slots-error">Error loading slots: {String(error?.message || error)}</div>;

  const handleNavigateToBooking = (slot) => {
    if (!user) {
      // Optionally persist intended redirect for after login:
      // localStorage.setItem('post_login_redirect', `/booking/${slot.id ?? slot.slot_id}`);
      navigate('/login');
      return;
    }
    const slotIdentifier = slot.id ?? slot.slot_id ?? slot.slot_number ?? slot.slotNumber;
    navigate(`/booking/${slotIdentifier}`, { state: { selectedSlot: slot } });
  };

  return (
    <div className="slots-grid">
      {slots.map((s) => {
        const status = String(s.status || 'AVAILABLE').toUpperCase();
        const isAvailable = status === 'AVAILABLE';

        return (
          <div
            key={s.slot_id ?? s.id ?? s.slot_number ?? `${s.slot_number}-${Math.random()}`}
            role="button"
            tabIndex={0}
            className={`slot-card slot-${status.toLowerCase()} ${isAvailable ? 'slot-available' : 'slot-unavailable'}`}
            onClick={() => isAvailable && handleNavigateToBooking(s)}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && isAvailable) handleNavigateToBooking(s); }}
            aria-disabled={!isAvailable}
            aria-label={`Slot ${s.slot_number ?? s.code ?? s.id} — ${status}`}
          >
            <div className="slot-card-row">
              <div className="slot-number">{s.slot_number ?? s.code ?? `#${s.id ?? s.slot_id}`}</div>
              <div className={`slot-badge ${isAvailable ? 'slot-badge-available' : 'slot-badge-taken'}`}>
                {isAvailable ? 'AVAILABLE' : s.status}
              </div>
            </div>

            <div className="slot-meta">
              {s.level ? `Level ${s.level}` : 'Level —'} · {s.type ?? 'Standard'} · ${s.price_per_hour ?? 5}/hr
            </div>

            <div className="slot-footer">
              <div className="slot-hint">
                {isAvailable ? 'Tap to reserve' : (s.occupied_by ? `Taken by user ${s.occupied_by}` : s.status)}
              </div>

              <button
                type="button"
                className="slot-action"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!user) { navigate('/login'); return; }
                  if (!isAvailable) return;
                  const slotIdentifier = s.id ?? s.slot_id ?? s.slot_number;
                  navigate(`/booking/${slotIdentifier}`, { state: { selectedSlot: s } });
                }}
                disabled={!isAvailable || !user}
              >
                {isAvailable ? 'Reserve' : 'Unavailable'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}