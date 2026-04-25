// src/pages/AdminPanel.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Spinner } from 'react-bootstrap';
import { FaPlus, FaTrash, FaUsers, FaParking, FaCheckCircle, FaCarSide } from 'react-icons/fa';
import api, { getSlots, createSlot, updateSlot, deleteSlot, getUsers } from '../services/api';
import styled from 'styled-components';

const Card = styled.div`
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  margin-bottom: 24px;
`;

const ALLOWED_STATUSES = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE'];

function getSlotIdentifier(slot) {
  return slot?.id ?? slot?.slot_id ?? slot?.slot_number;
}

export default function AdminPanel() {
  const qc = useQueryClient();
  const [slotNumber, setSlotNumber] = useState('');
  const [pricePerHour, setPricePerHour] = useState(5);
  const [newStatus, setNewStatus] = useState('AVAILABLE');
  const [reservedMinutesNew, setReservedMinutesNew] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('slots');

  // Fetch slots (uses helpers from services/api.js)
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['slots'],
    queryFn: getSlots,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: activeTab === 'users',
  });

  const addSlotMutation = useMutation({
    mutationFn: (data) => createSlot(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['slots'] });
      setSlotNumber('');
      setPricePerHour(5);
      setNewStatus('AVAILABLE');
      setReservedMinutesNew('');
      setMsg({ text: 'Slot added successfully!', type: 'success' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    },
    onError: (e) => setMsg({ text: e?.response?.data?.error || 'Failed to add slot', type: 'error' }),
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (id) => deleteSlot(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: (e) => setMsg({ text: e?.response?.data?.error || 'Failed to delete slot', type: 'error' }),
  });

  const updateSlotMutation = useMutation({
    mutationFn: ({ id, updates }) => updateSlot(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['slots'] }),
    onError: (e) => setMsg({ text: e?.response?.data?.error || 'Failed to update slot', type: 'error' }),
  });

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!slotNumber.trim()) return;

    const payload = {
      slot_number: slotNumber.trim().toUpperCase(),
      status: newStatus,
      price_per_hour: Number(pricePerHour || 5),
    };

    if (String(newStatus).toUpperCase() === 'RESERVED') {
      const mins = reservedMinutesNew ? parseInt(reservedMinutesNew, 10) : null;
      if (!mins || Number.isNaN(mins) || mins <= 0) {
        return setMsg({ text: 'Provide reserved_minutes (positive integer) when creating RESERVED slot', type: 'error' });
      }
      payload.reserved_minutes = mins;
    }

    addSlotMutation.mutate(payload);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slot? This cannot be undone.')) return;
    deleteSlotMutation.mutate(id);
  };

  const handleChangeStatus = async (slot, selectedStatus) => {
    const id = getSlotIdentifier(slot);
    if (!id) return setMsg({ text: 'Cannot determine slot id', type: 'error' });

    const updates = { status: selectedStatus };

    if (String(selectedStatus).toUpperCase() === 'RESERVED') {
      const minsStr = prompt('Reserved minutes (positive integer)', '60');
      if (minsStr === null) return; // user cancelled
      const mins = parseInt(minsStr, 10);
      if (!mins || Number.isNaN(mins) || mins <= 0) {
        return alert('Invalid reserved minutes');
      }
      updates.reserved_minutes = mins;
    }

    try {
      await updateSlotMutation.mutateAsync({ id, updates });
      setMsg({ text: 'Slot updated', type: 'success' });
      setTimeout(() => setMsg({ text: '', type: '' }), 2500);
    } catch (err) {
      // onError handles setting msg
      console.error('Update slot error', err);
    }
  };

  const available = Array.isArray(slots) ? slots.filter(s => String(s.status).toUpperCase() === 'AVAILABLE').length : 0;
  const occupied = Array.isArray(slots) ? slots.filter(s => String(s.status).toUpperCase() === 'OCCUPIED').length : 0;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.8rem', color: '#00d2ff', marginBottom: 4 }}>🏗️ Admin Panel</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Manage parking slots and users</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Slots', value: slots.length, color: '#00d2ff', icon: <FaParking /> },
          { label: 'Available', value: available, color: '#22c55e', icon: <FaCheckCircle /> },
          { label: 'Occupied', value: occupied, color: '#ef4444', icon: <FaCarSide /> },
          { label: 'Users', value: users.length, color: '#a78bfa', icon: <FaUsers /> },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: s.color, fontSize: 20 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['slots', 'users'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding: '10px 20px', background: activeTab === t ? 'linear-gradient(135deg,#00d2ff,#3a7bd5)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeTab === t ? 'transparent' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, color: activeTab === t ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 14, textTransform: 'capitalize' }}>
            {t === 'slots' ? '🅿️ Slots' : '👥 Users'}
          </button>
        ))}
      </div>

      {/* Slots Tab */}
      {activeTab === 'slots' && (
        <>
          <Card>
            <h4 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: 16 }}>Add New Slot</h4>
            <form onSubmit={handleAddSlot} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                type="text" placeholder="e.g. A1, B2, VIP-01"
                value={slotNumber} onChange={e => setSlotNumber(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: '12px 16px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#f8fafc', fontSize: 15 }}
              />

              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ width: 160, padding: '12px 16px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#f8fafc', fontSize: 15 }}
              >
                {ALLOWED_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {String(newStatus).toUpperCase() === 'RESERVED' && (
                <input
                  type="number"
                  placeholder="reserved_minutes"
                  value={reservedMinutesNew}
                  onChange={(e) => setReservedMinutesNew(e.target.value)}
                  style={{ width: 140, padding: '12px 16px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#f8fafc', fontSize: 15 }}
                />
              )}

              <input
                type="number" value={pricePerHour}
                onChange={e => setPricePerHour(e.target.value)}
                style={{ width: 120, padding: '12px 16px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#f8fafc', fontSize: 15 }}
              />
              <button type="submit" disabled={addSlotMutation.isLoading}
                style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                {addSlotMutation.isLoading ? <Spinner animation="border" size="sm" /> : <><FaPlus /> Add Slot</>}
              </button>
            </form>
            {msg.text && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: msg.type === 'success' ? '#86efac' : '#fca5a5', fontSize: 13 }}>
                {msg.text}
              </div>
            )}
          </Card>

          <Card>
            <h4 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: 16 }}>All Slots ({slots.length})</h4>
            {loadingSlots ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spinner animation="border" style={{ color: '#00d2ff' }} /></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {slots.map(slot => {
                  const id = getSlotIdentifier(slot);
                  const status = String(slot.status || 'AVAILABLE').toUpperCase();
                  return (
                    <div key={id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: 16 }}>{slot.slot_number ?? id}</span>
                        <button onClick={() => handleDelete(id)}
                          disabled={String(slot.status).toUpperCase() === 'OCCUPIED' || deleteSlotMutation.isLoading}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#fca5a5', padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>
                          <FaTrash size={11} />
                        </button>
                      </div>

                      <select
                        value={status}
                        onChange={(e) => handleChangeStatus(slot, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: 'rgba(15,23,42,0.7)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 8,
                          color: status === 'AVAILABLE' ? '#22c55e' : status === 'OCCUPIED' ? '#ef4444' : '#eab308',
                          fontSize: 13,
                          cursor: 'pointer'
                        }}
                      >
                        {ALLOWED_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>

                      {slot.reserved_until && (
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                          Reserved until: {new Date(slot.reserved_until).toLocaleString()}
                        </div>
                      )}

                      <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>${slot.price_per_hour || 5}/hr</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <h4 style={{ color: '#f8fafc', fontWeight: 700, marginBottom: 16 }}>Registered Users ({users.length})</h4>
          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spinner animation="border" style={{ color: '#00d2ff' }} /></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['ID', 'Email', 'Role', 'Joined'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>#{u.id}</td>
                      <td style={{ padding: '10px 12px', color: '#f8fafc' }}>{u.email}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.role === 'ADMIN' ? 'rgba(239,68,68,0.15)' : 'rgba(0,210,255,0.15)', color: u.role === 'ADMIN' ? '#fca5a5' : '#00d2ff' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
