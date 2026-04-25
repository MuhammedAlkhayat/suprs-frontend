import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import api from '../services/api';
import { gsap } from 'gsap';
import {
  FaUser, FaEnvelope, FaPhone, FaCar, FaPlus,
  FaTrash, FaEdit, FaSave, FaTimes, FaCheckCircle,
  FaShieldAlt, FaHistory, FaCreditCard, FaStar,
  FaIdBadge, FaCalendarAlt, FaDollarSign,
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────
// Avatar with gradient initials
// ─────────────────────────────────────────────────────────────
function Avatar({ name, email, size = 80 }) {
  const letter = (name || email || 'U')[0].toUpperCase();
  const colors = [
    ['#00d2ff','#3a7bd5'], ['#f59e0b','#d97706'],
    ['#10b981','#059669'], ['#8b5cf6','#7c3aed'],
  ];
  const idx = (letter.charCodeAt(0) % colors.length);
  const [from, to] = colors[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg,${from},${to})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 900, color: '#001219',
      boxShadow: `0 8px 32px ${from}55`,
      flexShrink: 0, userSelect: 'none',
    }}>
      {letter}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stat pill
// ─────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, color = '#00d2ff' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '12px 20px', borderRadius: 16,
      background: `${color}0d`,
      border: `1px solid ${color}22`,
      minWidth: 80, flex: 1,
    }}>
      <div style={{ color, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Vehicle card
// ─────────────────────────────────────────────────────────────
function VehicleCard({ vehicle, onDelete, onSetDefault }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 16,
        background: vehicle.is_default
          ? 'rgba(0,210,255,0.06)'
          : hover ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${vehicle.is_default ? 'rgba(0,210,255,0.25)' : hover ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
        transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden',
      }}>
      {vehicle.is_default && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg,transparent,rgba(0,210,255,0.6),transparent)',
        }} />
      )}
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: vehicle.is_default ? 'rgba(0,210,255,0.12)' : 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, border: `1px solid ${vehicle.is_default ? 'rgba(0,210,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
      }}>
        <FaCar size={20} color={vehicle.is_default ? '#00d2ff' : 'var(--text-muted)'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', fontFamily: "'Courier New', monospace", letterSpacing: 1 }}>
            {vehicle.plate_number}
          </span>
          {vehicle.is_default && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: '#00d2ff',
              background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)',
              borderRadius: 99, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              ★ Default
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {[vehicle.color, vehicle.make, vehicle.model].filter(Boolean).join(' · ') || 'No details added'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {!vehicle.is_default && (
          <button onClick={() => onSetDefault(vehicle.id)} title="Set as default"
            style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 9, padding: '7px 10px', cursor: 'pointer',
              color: '#f59e0b', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
            }}>
            <FaStar size={10} /> Set Default
          </button>
        )}
        <button onClick={() => onDelete(vehicle.id)}
          style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 9, padding: '7px 9px', cursor: 'pointer',
            color: '#ef4444', transition: 'all 0.15s',
          }}>
          <FaTrash size={12} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Add vehicle inline form
// ─────────────────────────────────────────────────────────────
function AddVehicleForm({ onAdd, onCancel, loading }) {
  const [form, setForm] = useState({ plate_number: '', make: '', model: '', color: '' });
  const ref = useRef(null);

  useEffect(() => {
    gsap.fromTo(ref.current, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
  }, []);

  const fields = [
    { name: 'plate_number', placeholder: 'Plate Number *', required: true, mono: true },
    { name: 'color',        placeholder: 'Color (e.g. White)' },
    { name: 'make',         placeholder: 'Make (e.g. Toyota)' },
    { name: 'model',        placeholder: 'Model (e.g. Camry)' },
  ];

  return (
    <div ref={ref} style={{
      padding: '16px', borderRadius: 16, marginTop: 12,
      background: 'rgba(0,210,255,0.03)',
      border: '1px dashed rgba(0,210,255,0.25)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#00d2ff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        + New Vehicle
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {fields.map(f => (
          <input key={f.name} name={f.name} placeholder={f.placeholder}
            value={form[f.name]} required={f.required}
            onChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))}
            style={{
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 9, padding: '10px 12px',
              color: 'white', fontSize: 13,
              fontFamily: f.mono ? "'Courier New', monospace" : 'inherit',
              letterSpacing: f.mono ? 1 : 'normal',
              outline: 'none', width: '100%', boxSizing: 'border-box',
            }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { if (!form.plate_number.trim()) return; onAdd(form); }}
          disabled={loading}
          style={{
            flex: 1, padding: '10px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)',
            color: '#001219', fontWeight: 800, fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
          {loading ? 'Adding…' : <><FaPlus size={11} /> Add Vehicle</>}
        </button>
        <button onClick={onCancel}
          style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-muted)', cursor: 'pointer',
          }}>
          <FaTimes size={12} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Info row (read mode)
// ─────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '13px 16px', borderRadius: 14,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(0,210,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color: '#00d2ff' }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: accent || 'var(--text-primary)', wordBreak: 'break-word' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Profile page
// ─────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, login } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const pageRef = useRef(null);

  const [activeTab,  setActiveTab]  = useState('profile');
  const [editMode,   setEditMode]   = useState(false);
  const [showAddVeh, setShowAddVeh] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '' });
  }, [user]);

  useEffect(() => {
    if (!pageRef.current) return;
    gsap.fromTo(pageRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, []);

  // ── Queries ───────────────────────────────────────────────
  const { data: vehicles = [], isLoading: loadVeh } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
    enabled: !!user,
  });

  const { data: bookings = [], isLoading: loadBook } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings/my').then(r => r.data),
    enabled: !!user,
  });

  const { data: payments = [], isLoading: loadPay } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => api.get('/payments/my').then(r => r.data),
    enabled: !!user,
  });

  // ── Mutations ─────────────────────────────────────────────
  const updateProfile = useMutation({
    mutationFn: (data) => api.patch('/users/profile', data).then(r => r.data),
    onSuccess: (data) => {
      if (data.user) login(data.user, localStorage.getItem('suprs-token'));
      setEditMode(false);
      showToast('Profile updated!', 'Your changes have been saved.', 'success');
    },
    onError: () => showToast('Update failed', 'Please try again.', 'error'),
  });

  const addVehicle = useMutation({
    mutationFn: (data) => api.post('/vehicles', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      setShowAddVeh(false);
      showToast('Vehicle added! 🚗', '', 'success');
    },
    onError: () => showToast('Failed to add vehicle', '', 'error'),
  });

  const deleteVehicle = useMutation({
    mutationFn: (id) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      showToast('Vehicle removed', '', 'info');
    },
  });

  const setDefaultVehicle = useMutation({
    mutationFn: (id) => api.patch(`/vehicles/${id}/default`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });

  // ── Tabs config ───────────────────────────────────────────
  const TABS = [
    { key: 'profile',  icon: <FaUser size={12} />,       label: 'Profile' },
    { key: 'vehicles', icon: <FaCar size={12} />,        label: 'Vehicles', count: vehicles.length },
    { key: 'bookings', icon: <FaHistory size={12} />,    label: 'Bookings', count: bookings.length },
    { key: 'payments', icon: <FaCreditCard size={12} />, label: 'Payments', count: payments.length },
  ];

  const statusColor = (s) => ({
    ACTIVE: '#10b981', COMPLETED: '#3b82f6', CANCELLED: '#ef4444',
    PAID: '#10b981', PENDING: '#f59e0b', FAILED: '#ef4444', CASH: '#94a3b8',
  }[s] || '#94a3b8');

  const totalSpent = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div ref={pageRef} style={{ maxWidth: 740, margin: '0 auto', paddingBottom: 40 }}>

      {/* ── Hero card ──────────────────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: 20, padding: '1.8rem', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(0,210,255,0.08),transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <Avatar name={user?.name} email={user?.email} size={76} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </h2>
              {user?.verified && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 800, color: '#10b981',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 99, padding: '2px 8px',
                }}>
                  <FaCheckCircle size={8} /> Verified
                </span>
              )}
              <span style={{
                fontSize: 10, fontWeight: 800,
                color: user?.role === 'ADMIN' ? '#f59e0b' : '#00d2ff',
                background: user?.role === 'ADMIN' ? 'rgba(245,158,11,0.1)' : 'rgba(0,210,255,0.1)',
                border: `1px solid ${user?.role === 'ADMIN' ? 'rgba(245,158,11,0.2)' : 'rgba(0,210,255,0.2)'}`,
                borderRadius: 99, padding: '2px 8px',
              }}>
                {user?.role || 'USER'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {user?.email}
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <StatPill icon={<FaHistory size={13} />}    label="Bookings" value={bookings.length}                    color="#00d2ff" />
              <StatPill icon={<FaCar size={13} />}        label="Vehicles" value={vehicles.length}                    color="#8b5cf6" />
              <StatPill icon={<FaDollarSign size={13} />} label="Spent"    value={`$${totalSpent.toFixed(0)}`}        color="#10b981" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 16,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: 4, flexWrap: 'wrap',
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1, minWidth: 90, padding: '10px 8px',
              borderRadius: 12, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: activeTab === t.key
                ? 'linear-gradient(135deg,rgba(0,210,255,0.15),rgba(58,123,213,0.08))'
                : 'transparent',
              color: activeTab === t.key ? '#00d2ff' : 'var(--text-muted)',
              border: activeTab === t.key ? '1px solid rgba(0,210,255,0.2)' : '1px solid transparent',
              transition: 'all 0.2s', position: 'relative',
            }}>
            {t.icon} {t.label}
            {t.count > 0 && (
              <span style={{
                fontSize: 9, fontWeight: 800, minWidth: 16, height: 16,
                background: activeTab === t.key ? '#00d2ff' : 'rgba(255,255,255,0.1)',
                color: activeTab === t.key ? '#001219' : 'var(--text-muted)',
                borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Profile ───────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="glass-card" style={{ padding: '1.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Personal Information</h4>
            <button onClick={() => { setEditMode(e => !e); setForm({ name: user?.name || '', phone: user?.phone || '' }); }}
              style={{
                background: editMode ? 'rgba(239,68,68,0.08)' : 'rgba(0,210,255,0.08)',
                border: `1px solid ${editMode ? 'rgba(239,68,68,0.2)' : 'rgba(0,210,255,0.2)'}`,
                borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
                color: editMode ? '#ef4444' : '#00d2ff',
                fontWeight: 700, fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              }}>
              {editMode ? <><FaTimes size={11} /> Cancel</> : <><FaEdit size={11} /> Edit Profile</>}
            </button>
          </div>

          {editMode ? (
            <div>
              {[
                { label: 'Full Name',     name: 'name',  icon: <FaUser size={13} />,  placeholder: 'Mohammed Al-Khayyat' },
                { label: 'Phone Number',  name: 'phone', icon: <FaPhone size={13} />, placeholder: '+966 5X XXX XXXX' },
              ].map(f => (
                <div key={f.name} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    {f.label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#00d2ff' }}>
                      {f.icon}
                    </span>
                    <input
                      name={f.name} placeholder={f.placeholder}
                      value={form[f.name]}
                      onChange={e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))}
                      style={{
                        width: '100%', padding: '12px 12px 12px 36px',
                        background: 'rgba(15,23,42,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, color: 'white', fontSize: 14,
                        outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,210,255,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => updateProfile.mutate(form)}
                disabled={updateProfile.isPending}
                style={{
                  padding: '11px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)',
                  color: '#001219', fontWeight: 800, fontSize: 13,
                  cursor: updateProfile.isPending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(0,210,255,0.25)',
                }}>
                {updateProfile.isPending ? 'Saving…' : <><FaSave size={13} /> Save Changes</>}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <InfoRow icon={<FaUser size={14} />}     label="Full Name"    value={user?.name  || '—'} />
              <InfoRow icon={<FaEnvelope size={14} />} label="Email"        value={user?.email || '—'} />
              <InfoRow icon={<FaPhone size={14} />}    label="Phone"        value={user?.phone || '—'} />
              <InfoRow icon={<FaIdBadge size={14} />}  label="Role"         value={user?.role  || 'USER'} accent={user?.role === 'ADMIN' ? '#f59e0b' : '#00d2ff'} />
              <InfoRow
                icon={<FaShieldAlt size={14} />}
                label="Account Status"
                value={user?.verified ? '✅ Verified Account' : '⚠️ Not Verified'}
                accent={user?.verified ? '#10b981' : '#f59e0b'}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Vehicles ───────────────────────────────────── */}
      {activeTab === 'vehicles' && (
        <div className="glass-card" style={{ padding: '1.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>My Vehicles</h4>
            <button onClick={() => setShowAddVeh(v => !v)}
              style={{
                background: showAddVeh ? 'rgba(239,68,68,0.08)' : 'rgba(0,210,255,0.08)',
                border: `1px solid ${showAddVeh ? 'rgba(239,68,68,0.2)' : 'rgba(0,210,255,0.2)'}`,
                borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                color: showAddVeh ? '#ef4444' : '#00d2ff',
                fontWeight: 700, fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              {showAddVeh ? <><FaTimes size={11} /> Cancel</> : <><FaPlus size={11} /> Add Vehicle</>}
            </button>
          </div>

          {showAddVeh && (
            <AddVehicleForm
              onAdd={(data) => addVehicle.mutate(data)}
              onCancel={() => setShowAddVeh(false)}
              loading={addVehicle.isPending}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: showAddVeh ? 14 : 0 }}>
            {loadVeh ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🚗</div>Loading vehicles…
              </div>
            ) : vehicles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <FaCar size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
                <div style={{ fontWeight: 700, marginBottom: 4 }}>No vehicles yet</div>
                <div style={{ fontSize: 12 }}>Add your vehicle to speed up bookings</div>
              </div>
            ) : (
              vehicles.map(v => (
                <VehicleCard key={v.id} vehicle={v}
                  onDelete={(id) => deleteVehicle.mutate(id)}
                  onSetDefault={(id) => setDefaultVehicle.mutate(id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Bookings ───────────────────────────────────── */}
      {activeTab === 'bookings' && (
        <div className="glass-card" style={{ padding: '1.6rem' }}>
          <h4 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: '1rem' }}>Booking History</h4>
          {loadBook ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading…</div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <FaHistory size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
              <div style={{ fontWeight: 700 }}>No bookings yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bookings.map(b => (
                <div key={b.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: 'rgba(0,210,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>🅿️</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3 }}>
                      Slot {b.slots?.slot_number || b.slot_id}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span><FaCalendarAlt size={9} style={{ marginRight: 3 }} />
                        {b.check_in ? new Date(b.check_in).toLocaleDateString() : 'N/A'}
                      </span>
                      {b.duration_hours && <span>⏱ {b.duration_hours}h</span>}
                      {b.total_amount > 0 && <span>💰 ${b.total_amount}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '3px 9px',
                      background: `${statusColor(b.status)}18`,
                      color: statusColor(b.status),
                      border: `1px solid ${statusColor(b.status)}33`,
                    }}>
                      {b.status || 'ACTIVE'}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '3px 9px',
                      background: `${statusColor(b.payment_status)}18`,
                      color: statusColor(b.payment_status),
                      border: `1px solid ${statusColor(b.payment_status)}33`,
                    }}>
                      {b.payment_status || 'PENDING'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Payments ───────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="glass-card" style={{ padding: '1.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Payment History</h4>
            {totalSpent > 0 && (
              <div style={{
                fontSize: 13, fontWeight: 800,
                background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Total: ${totalSpent.toFixed(2)}
              </div>
            )}
          </div>
          {loadPay ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading…</div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <FaCreditCard size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
              <div style={{ fontWeight: 700 }}>No payments yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {payments.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: p.status === 'PAID' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {p.method === 'VISA' ? '💳' : p.method === 'MASTERCARD' ? '💳' : '💵'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3 }}>
                      {p.method || 'CASH'} Payment
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {p.transaction_ref || 'N/A'} · {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{ fontWeight: 900, fontSize: 15, color: p.status === 'PAID' ? '#10b981' : '#f59e0b' }}>
                      ${Number(p.amount).toFixed(2)}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '2px 8px',
                      background: `${statusColor(p.status)}18`,
                      color: statusColor(p.status),
                      border: `1px solid ${statusColor(p.status)}33`,
                    }}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
