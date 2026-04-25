// src/pages/Dashboard.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import {
  FaParking,
  FaCar,
  FaCheckCircle,
  FaClock,
  FaFire,
  FaChartBar,
} from 'react-icons/fa';
import Slots from '../components/Slots'; // <-- added import

function CountdownTimer({ checkIn, durationHours }) {
  const [remaining, setRemaining] = useState('…');

  useEffect(() => {
    if (!checkIn) {
      setRemaining('Unknown');
      return;
    }

    const start = new Date(checkIn).getTime();
    if (Number.isNaN(start)) {
      setRemaining('Invalid time');
      return;
    }

    const end = start + Number(durationHours || 0) * 3600000;

    const tick = () => {
      const diff = end - Date.now();

      if (diff <= 0) {
        setRemaining('Expired');
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      setRemaining(
        `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkIn, durationHours]);

  const isExpiring = remaining !== 'Expired' && remaining.startsWith('0h');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 'var(--radius)',
        background: isExpiring ? 'rgba(239,68,68,0.1)' : 'rgba(0,210,255,0.08)',
        border: `1px solid ${
          isExpiring ? 'rgba(239,68,68,0.3)' : 'rgba(0,210,255,0.2)'
        }`,
      }}
    >
      <FaClock size={14} color={isExpiring ? '#ef4444' : '#00d2ff'} />
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: isExpiring ? '#ef4444' : '#00d2ff',
        }}
      >
        {remaining}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>remaining</span>
    </div>
  );
}

function OccupancyHeatmap() {
  const heat = useMemo(
    () =>
      Array.from({ length: 24 }, (_, h) => {
        if (h >= 7 && h <= 9) return 0.9;
        if (h >= 12 && h <= 14) return 0.75;
        if (h >= 17 && h <= 19) return 0.85;
        if (h >= 22 || h <= 5) return 0.1;
        return 0.3 + Math.random() * 0.2;
      }),
    []
  );

  const color = (v) => {
    if (v >= 0.8) return '#ef4444';
    if (v >= 0.6) return '#f59e0b';
    if (v >= 0.3) return '#3b82f6';
    return '#10b981';
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 40 }}>
        {heat.map((v, i) => (
          <div
            key={i}
            title={`${i}:00 — ${Math.round(v * 100)}% occupancy`}
            style={{
              flex: 1,
              height: `${v * 100}%`,
              minHeight: 4,
              background: color(v),
              borderRadius: 2,
              transition: 'height 0.5s ease',
              cursor: 'pointer',
              opacity: 0.8,
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          color: 'var(--text-muted)',
          marginTop: 4,
        }}
      >
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>11pm</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['slots'],
    queryFn: () => api.get('/slots').then((r) => r.data),
    refetchInterval: false,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get('/bookings').then((r) => r.data),
    enabled: !!user,
  });

  useEffect(() => {
    if (!containerRef.current || loadingSlots) return;

    gsap.fromTo(
      containerRef.current.querySelectorAll('.dash-anim'),
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: 'power3.out' }
    );
  }, [loadingSlots]);

  const available = slots.filter((s) => s.status === 'AVAILABLE').length;
  const occupied = slots.filter((s) => s.status === 'OCCUPIED').length;
  const reserved = slots.filter((s) => s.status === 'RESERVED').length;
  const total = slots.length || 1;
  const occupancyPct = Math.round((occupied / total) * 100);

  const myActiveBooking = bookings.find(
    (b) => b.status === 'ACTIVE' && b.user_id === user?.id
  );
  const mySlot = myActiveBooking
    ? slots.find((s) => s.id === myActiveBooking.slot_id)
    : null;

  const stats = [
    {
      label: 'Available',
      value: available,
      icon: <FaCheckCircle />,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      cls: 'green',
    },
    {
      label: 'Occupied',
      value: occupied,
      icon: <FaCar />,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      cls: 'red',
    },
    {
      label: 'Reserved',
      value: reserved,
      icon: <FaParking />,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      cls: 'yellow',
    },
    {
      label: 'Total Slots',
      value: total,
      icon: <FaChartBar />,
      color: '#00d2ff',
      bg: 'rgba(0,210,255,0.12)',
      cls: 'primary',
    },
  ];

  if (loadingSlots) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="suprs-spinner" style={{ width: 52, height: 52 }} />
      </div>
    );
  }

  return (
    <div className="page page-dashboard" ref={containerRef} role="main" aria-label="Dashboard">
      <div className="dash-anim" style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 900, marginBottom: 4 }}>
          👋 Welcome back,{' '}
          <span className="text-gradient">
            {user?.name || user?.email?.split('@')?.[0] || 'User'}
          </span>
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {' · '}Real-time parking status
        </p>
      </div>

      {myActiveBooking && mySlot && (
        <div
          className="dash-anim glass-card glow-primary"
          style={{ marginBottom: 24, padding: '1.2rem 1.5rem' }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius)',
                  background: 'rgba(0,210,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                🅿️
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
                  Active Booking — Slot {mySlot.slot_number}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {myActiveBooking.duration_hours}h · $
                  {Number(myActiveBooking.total_amount || 0).toFixed(2)} ·{' '}
                  <span
                    style={{
                      color:
                        myActiveBooking.payment_status === 'PAID'
                          ? '#10b981'
                          : '#f59e0b',
                      fontWeight: 600,
                    }}
                  >
                    {myActiveBooking.payment_status}
                  </span>
                </div>
              </div>
            </div>

            <CountdownTimer
              checkIn={myActiveBooking.check_in || myActiveBooking.booked_at}
              durationHours={myActiveBooking.duration_hours || 1}
            />
          </div>
        </div>
      )}

      <div
        className="dash-anim stagger-children"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
          gap: 14,
          marginBottom: 28,
        }}
      >
        {stats.map((s) => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="stat-value" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="dash-anim"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: 20,
          marginBottom: 28,
        }}
      >
        <div className="glass-card" style={{ padding: '1.4rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <h5 style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>🔥 Occupancy Rate</h5>
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color:
                  occupancyPct >= 80
                    ? '#ef4444'
                    : occupancyPct >= 50
                    ? '#f59e0b'
                    : '#10b981',
              }}
            >
              {occupancyPct}%
            </span>
          </div>

          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${occupancyPct}%`,
                background:
                  occupancyPct >= 80
                    ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                    : occupancyPct >= 50
                    ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                    : 'linear-gradient(90deg,#10b981,#059669)',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 8,
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <span>{available} available</span>
            <span>{occupied} occupied</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.4rem' }}>
          <h5 style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14 }}>
            <FaFire size={13} color="#f59e0b" style={{ marginRight: 6 }} />
            Hourly Demand Heatmap
          </h5>

          <OccupancyHeatmap />

          <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10, color: 'var(--text-muted)' }}>
            {[
              ['#10b981', 'Low'],
              ['#3b82f6', 'Medium'],
              ['#f59e0b', 'High'],
              ['#ef4444', 'Peak'],
            ].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-anim glass-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <h4 style={{ margin: 0, fontWeight: 800 }}>🅿️ Live Parking Map</h4>
          <button
            className="btn-suprs"
            onClick={() => navigate('/booking')}
            style={{ padding: '10px 20px', fontSize: 13 }}
          >
            + Book a Slot
          </button>
        </div>

        {/* Use the shared Slots component (clicking a slot navigates to /booking/:slotId and passes selectedSlot in state) */}
        <Slots />

        {slots.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No slots configured yet. Ask an admin to add slots.
          </div>
        )}
      </div>
    </div>
  );
}
