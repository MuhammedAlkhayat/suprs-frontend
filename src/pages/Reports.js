import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from 'react-bootstrap';
import { gsap } from 'gsap';
import { FaChartLine, FaWallet, FaCar, FaParking, FaDownload } from 'react-icons/fa';
import api from '../services/api';
import styled from 'styled-components';

const Card = styled.div`
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px; padding: 2rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 1.4rem;
  display: flex; align-items: center; gap: 14px;
  transition: transform 0.2s;
  &:hover { transform: translateY(-4px); }
`;

const IconBox = styled.div`
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: ${p => p.$bg || 'rgba(0,210,255,0.12)'};
  color: ${p => p.$color || '#00d2ff'};
  flex-shrink: 0;
`;

const Badge = styled.span`
  padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
  background: ${p => p.$bg}; color: ${p => p.$color};
`;

function OccupancyBar({ value }) {
  const color = value >= 80 ? '#ef4444' : value >= 50 ? '#eab308' : '#22c55e';
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 8, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 1s ease' }} />
    </div>
  );
}

export default function Reports() {
  const containerRef = useRef(null);

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get('/bookings').then(r => r.data),
  });

  const { data: slots = [] } = useQuery({
    queryKey: ['slots'],
    queryFn: () => api.get('/slots').then(r => r.data),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  useEffect(() => {
    if (!containerRef.current || loadingBookings) return;
    const nodes = containerRef.current.querySelectorAll('.anim-item');
    if (!nodes.length) return;
    gsap.fromTo(nodes,
      { y: 24, opacity: 0 },
      { duration: 0.6, y: 0, opacity: 1, stagger: 0.1, ease: 'power2.out' }
    );
  }, [loadingBookings]);

  // Computed stats
  const totalSlots    = slots.length || 1;
  const occupied      = slots.filter(s => s.status === 'OCCUPIED').length;
  const available     = slots.filter(s => s.status === 'AVAILABLE').length;
  const occupancyRate = Math.round((occupied / totalSlots) * 100);
  const paidBookings  = bookings.filter(b => b.payment_status === 'PAID');
  const totalRevenue  = paidBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
  const todayBookings = bookings.filter(b => {
    const d = new Date(b.booked_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  // Method breakdown
  const methodCounts = bookings.reduce((acc, b) => {
    const m = b.payment_method || 'CASH';
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});

  const exportCSV = () => {
    const headers = ['Booking ID', 'Slot ID', 'User ID', 'Booked At', 'Duration (hrs)', 'Amount', 'Payment Status', 'Method'];
    const rows = bookings.map(b => [
      b.booking_id, b.slot_id, b.user_id,
      new Date(b.booked_at).toLocaleString(),
      b.duration_hours || 1,
      b.total_amount || 0,
      b.payment_status || 'PENDING',
      b.payment_method || 'CASH',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `suprs-report-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingBookings) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Spinner animation="border" style={{ color: '#00d2ff', width: 48, height: 48 }} />
    </div>
  );

  return (
    <div ref={containerRef}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: '1.8rem', color: '#00d2ff', marginBottom: 4 }}>📊 Analytics & Reports</h1>
          <p style={{ color: '#64748b', margin: 0 }}>System-wide parking statistics</p>
        </div>
        <button onClick={exportCSV}
          style={{ padding: '10px 20px', background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.3)', borderRadius: 12, color: '#00d2ff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <FaDownload size={13} /> Export CSV
        </button>
      </div>

      {/* Stats Grid */}
      <div className="anim-item" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard>
          <IconBox $bg="rgba(0,210,255,0.12)" $color="#00d2ff"><FaWallet size={20} /></IconBox>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Total Revenue</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#00d2ff' }}>${totalRevenue.toFixed(2)}</div>
          </div>
        </StatCard>
        <StatCard>
          <IconBox $bg="rgba(34,197,94,0.12)" $color="#22c55e"><FaParking size={20} /></IconBox>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Total Bookings</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{bookings.length}</div>
          </div>
        </StatCard>
        <StatCard>
          <IconBox $bg="rgba(239,68,68,0.12)" $color="#ef4444"><FaCar size={20} /></IconBox>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Occupancy Rate</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>{occupancyRate}%</div>
            <OccupancyBar value={occupancyRate} />
          </div>
        </StatCard>
        <StatCard>
          <IconBox $bg="rgba(167,139,250,0.12)" $color="#a78bfa"><FaChartLine size={20} /></IconBox>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Today's Bookings</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa' }}>{todayBookings}</div>
          </div>
        </StatCard>
      </div>

      {/* Slot Status + Payment Methods */}
      <div className="anim-item" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Slot Status */}
        <Card style={{ marginBottom: 0 }}>
          <h5 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: 16 }}>🅿️ Slot Status</h5>
          {[
            { label: 'Available', count: available, color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
            { label: 'Occupied',  count: occupied,  color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
            { label: 'Reserved',  count: slots.filter(s => s.status === 'RESERVED').length, color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: row.color }} />
                <span style={{ color: '#94a3b8', fontSize: 14 }}>{row.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 80, background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${(row.count / totalSlots) * 100}%`, height: '100%', background: row.color, borderRadius: 4 }} />
                </div>
                <span style={{ color: row.color, fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: 'right' }}>{row.count}</span>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 13 }}>
            <span>Total Slots</span>
            <span style={{ color: '#f8fafc', fontWeight: 700 }}>{totalSlots}</span>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card style={{ marginBottom: 0 }}>
          <h5 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: 16 }}>💳 Payment Methods</h5>
          {Object.entries(methodCounts).length === 0 ? (
            <div style={{ color: '#475569', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No payment data yet</div>
          ) : (
            Object.entries(methodCounts).map(([method, count]) => {
              const pct = Math.round((count / bookings.length) * 100);
              const colors = { VISA: '#1a1f71', MASTERCARD: '#eb001b', CASH: '#22c55e', GATE: '#eab308' };
              const color = colors[method] || '#00d2ff';
              return (
                <div key={method} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>{method}</span>
                    <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: 13 }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 1s ease' }} />
                  </div>
                </div>
              );
            })
          )}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 13 }}>
            <span>Paid Online</span>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>{paidBookings.length}</span>
          </div>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card className="anim-item">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <h5 style={{ color: '#f8fafc', fontWeight: 700, margin: 0 }}>📋 Recent Bookings</h5>
          <span style={{ color: '#64748b', fontSize: 13 }}>Showing last {Math.min(bookings.length, 15)} of {bookings.length}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['#', 'Slot', 'User', 'Booked At', 'Duration', 'Amount', 'Payment', 'Method'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#475569' }}>No bookings yet</td></tr>
              ) : (
                bookings.slice(0, 15).map(b => (
                  <tr key={b.booking_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>#{b.booking_id}</td>
                    <td style={{ padding: '10px 12px', color: '#f8fafc', fontWeight: 600 }}>{b.slot_id}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{b.user_id}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(b.booked_at).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{b.duration_hours || 1}h</td>
                    <td style={{ padding: '10px 12px', color: '#00d2ff', fontWeight: 700 }}>${Number(b.total_amount || 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {b.payment_status === 'PAID'
                        ? <Badge $bg="rgba(34,197,94,0.15)" $color="#86efac">PAID</Badge>
                        : b.payment_status === 'PAY_AT_GATE'
                        ? <Badge $bg="rgba(234,179,8,0.15)" $color="#fde68a">AT GATE</Badge>
                        : <Badge $bg="rgba(148,163,184,0.15)" $color="#94a3b8">PENDING</Badge>
                      }
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{b.payment_method || 'CASH'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Users Summary */}
      {users.length > 0 && (
        <Card className="anim-item">
          <h5 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: 16 }}>👥 User Summary</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
            {[
              { label: 'Total Users', value: users.length, color: '#00d2ff' },
              { label: 'Admins', value: users.filter(u => u.role === 'ADMIN').length, color: '#ef4444' },
              { label: 'Regular Users', value: users.filter(u => u.role === 'USER').length, color: '#22c55e' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
