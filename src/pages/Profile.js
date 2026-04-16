import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Spinner } from 'react-bootstrap';
import { FaUserCircle, FaEnvelope, FaIdBadge, FaSignOutAlt, FaTicketAlt, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import styled from 'styled-components';

const Card = styled.div`
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px; padding: 2rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
`;

const statusIcon = { ACTIVE: <FaClock color="#eab308" />, COMPLETED: <FaCheckCircle color="#22c55e" />, CANCELLED: <FaTimesCircle color="#ef4444" /> };
const payIcon    = { PAID: <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 700 }}>PAID</span>, PAY_AT_GATE: <span style={{ color: '#eab308', fontSize: 11, fontWeight: 700 }}>AT GATE</span>, PENDING: <span style={{ color: '#94a3b8', fontSize: 11 }}>PENDING</span> };

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings').then(r => r.data),
    enabled: activeTab === 'bookings',
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.delete(`/bookings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] }),
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  const tabs = [
    { key: 'info',     label: 'My Info' },
    { key: 'bookings', label: 'My Bookings' },
  ];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Avatar Header */}
      <Card style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32, color: '#001219', fontWeight: 900 }}>
          {user?.name ? user.name[0].toUpperCase() : user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 style={{ fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>{user?.name || 'User'}</h2>
        <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>{user?.email}</p>
        <span style={{ display: 'inline-block', marginTop: 8, padding: '4px 12px', background: user?.role === 'ADMIN' ? 'rgba(239,68,68,0.15)' : 'rgba(0,210,255,0.15)', color: user?.role === 'ADMIN' ? '#fca5a5' : '#00d2ff', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
          {user?.role || 'USER'}
        </span>
      </Card>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ flex: 1, padding: '12px', background: activeTab === t.key ? 'linear-gradient(135deg,#00d2ff,#3a7bd5)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeTab === t.key ? 'transparent' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, color: activeTab === t.key ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <Card>
          <h4 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: 20 }}>Account Information</h4>
          {[
            { icon: <FaUserCircle />, label: 'Full Name', value: user?.name || 'Not set' },
            { icon: <FaEnvelope />,   label: 'Email',     value: user?.email },
            { icon: <FaIdBadge />,    label: 'Role',      value: user?.role || 'USER' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#00d2ff', width: 20 }}>{row.icon}</div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{row.label}</div>
                <div style={{ fontWeight: 600, color: '#f8fafc' }}>{row.value}</div>
              </div>
            </div>
          ))}

          <button onClick={handleLogout}
            style={{ width: '100%', marginTop: 24, padding: '13px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#fca5a5', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14 }}>
            <FaSignOutAlt /> Sign Out
          </button>
        </Card>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <Card>
          <h4 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: 20 }}>
            <FaTicketAlt style={{ marginRight: 8, color: '#00d2ff' }} />My Bookings
          </h4>
          {loadingBookings ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spinner animation="border" style={{ color: '#00d2ff' }} /></div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No bookings yet. <span style={{ color: '#00d2ff', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Book a slot →</span></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookings.map(b => (
                <div key={b.booking_id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>Slot #{b.slot_id}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(b.booked_at).toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {statusIcon[b.status] || statusIcon.ACTIVE}
                      {payIcon[b.payment_status] || payIcon.PENDING}
                    </div>
                  </div>
                  {b.total_amount && (
                    <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                      Total: <span style={{ color: '#00d2ff', fontWeight: 700 }}>${b.total_amount}</span>
                      {b.duration_hours && ` · ${b.duration_hours}h`}
                    </div>
                  )}
                  {b.status === 'ACTIVE' && (
                    <button
                      onClick={() => cancelMutation.mutate(b.booking_id)}
                      disabled={cancelMutation.isPending}
                      style={{ marginTop: 10, padding: '6px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                      Cancel Booking
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}