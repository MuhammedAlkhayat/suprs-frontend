// src/components/Slots.js
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSlots, bookSlot } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import socket from '../services/socket'; // optional

export default function Slots() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: slots = [], isLoading } = useQuery(['slots'], getSlots, { staleTime: 5000 });

  const mutation = useMutation(bookSlot, {
    onSuccess: (data) => {
      // refresh slots
      queryClient.invalidateQueries(['slots']);
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="slots-grid">
      {slots.map(s => (
        <div key={s.slot_id} className={`slot-card slot-${s.status.toLowerCase()}`}>
          <div className="slot-code">{s.code}</div>
          <div className="slot-status">{s.status}</div>
          <div className="slot-price">${s.price_per_hour}/hr</div>
          <button
            disabled={s.status !== 'AVAILABLE' || !user}
            onClick={() => mutation.mutate({ slot_id: s.slot_id, user_id: user?.id })}
          >
            {s.status === 'AVAILABLE' ? 'Reserve' : 'Unavailable'}
          </button>
        </div>
      ))}
    </div>
  );
}