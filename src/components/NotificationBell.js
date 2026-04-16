import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { gsap } from 'gsap';
import {
  FaBell, FaCheckDouble, FaTrash,
  FaParking, FaCreditCard, FaTimes,
  FaInfoCircle, FaExclamationTriangle,
} from 'react-icons/fa';

const TYPE_CONFIG = {
  BOOKING: { icon: <FaParking size={13} />,             color: '#00d2ff', bg: 'rgba(0,210,255,0.1)' },
  PAYMENT: { icon: <FaCreditCard size={13} />,          color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  CANCEL:  { icon: <FaTimes size={13} />,               color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  ALERT:   { icon: <FaExclamationTriangle size={13} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  WELCOME: { icon: '👋',                                color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  INFO:    { icon: <FaInfoCircle size={13} />,          color: '#94a3b8', bg: 'rgba(148,163,184,0.1)'},
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const bellRef  = useRef(null);
  const panelRef = useRef(null);
  const dotRef   = useRef(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unread = notifications.filter(n => !n.is_read).length;

  // Real-time via socket
  useEffect(() => {
    const token = localStorage.getItem('suprs-token');
    if (!token || !user) return;
    let socket;
    try {
      const { io } = require('socket.io-client');
      socket = io(process.env.REACT_APP_API_URL || 'https://suprs-backend.onrender.com', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      socket.on('connect', () => socket.emit('join', `user_${user.id}`));
      socket.on('notification', (notif) => {
        qc.setQueryData(['notifications'], (old = []) => [
          { ...notif, id: Date.now(), is_read: false, created_at: new Date().toISOString() },
          ...old,
        ]);
        if (bellRef.current) {
          gsap.to(bellRef.current, {
            keyframes: [
              { rotation: -20, duration: 0.08 },
              { rotation: 20,  duration: 0.08 },
              { rotation: -15, duration: 0.08 },
              { rotation: 15,  duration: 0.08 },
              { rotation: 0,   duration: 0.1  },
            ],
          });
        }
        if (dotRef.current) {
          gsap.fromTo(dotRef.current, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
        }
      });
    } catch (e) { /* socket optional */ }
    return () => socket?.disconnect();
  }, [user, qc]);

  // Panel animation
  useEffect(() => {
    if (open && panelRef.current) {
      gsap.fromTo(panelRef.current,
        { opacity: 0, y: -8, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out' }
      );
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!panelRef.current?.contains(e.target) && !bellRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: (_, id) =>
      qc.setQueryData(['notifications'], (old = []) =>
        old.map(n => n.id === id ? { ...n, is_read: true } : n)
      ),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () =>
      qc.setQueryData(['notifications'], (old = []) =>
        old.map(n => ({ ...n, is_read: true }))
      ),
  });

  const deleteNotif = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: (_, id) =>
      qc.setQueryData(['notifications'], (old = []) => old.filter(n => n.id !== id)),
  });

  const clearAll = useMutation({
    mutationFn: () => api.delete('/notifications/clear-all'),
    onSuccess: () => qc.setQueryData(['notifications'], []),
  });

  const handleItemClick = useCallback((n) => {
    if (!n.is_read) markRead.mutate(n.id);
  }, [markRead]);

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          background: open ? 'rgba(0,210,255,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(0,210,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 12, padding: '9px 11px',
          cursor: 'pointer',
          color: open ? '#00d2ff' : 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
        <FaBell size={16} />
        {unread > 0 && (
          <span ref={dotRef} style={{
            position: 'absolute', top: 5, right: 5,
            width: 8, height: 8, borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 0 2px var(--bg-primary, #0a0f1e)',
          }} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div ref={panelRef} style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 360, maxHeight: 480,
          background: 'rgba(10,18,40,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          zIndex: 9999, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaBell size={14} color="#00d2ff" />
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                Notifications
              </span>
              {unread > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, minWidth: 18, height: 18,
                  background: '#ef4444', color: 'white',
                  borderRadius: 99, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', padding: '0 5px',
                }}>
                  {unread}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {unread > 0 && (
                <button onClick={() => markAllRead.mutate()}
                  style={{
                    background: 'rgba(0,210,255,0.08)',
                    border: '1px solid rgba(0,210,255,0.15)',
                    borderRadius: 8, padding: '5px 8px', cursor: 'pointer',
                    color: '#00d2ff', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                  <FaCheckDouble size={10} /> All Read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={() => clearAll.mutate()}
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 8, padding: '5px 8px', cursor: 'pointer',
                    color: '#ef4444', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                  <FaTrash size={9} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <FaBell size={32} style={{ marginBottom: 12, opacity: 0.15 }} />
                <div style={{ fontWeight: 700, marginBottom: 4 }}>All caught up!</div>
                <div style={{ fontSize: 12 }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map((n, i) => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
                return (
                  <div key={n.id || i}
                    onClick={() => handleItemClick(n)}
                    style={{
                      display: 'flex', gap: 12, padding: '12px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: n.is_read ? 'transparent' : 'rgba(0,210,255,0.03)',
                      cursor: 'pointer', transition: 'background 0.15s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(0,210,255,0.03)'}
                  >
                    {/* Unread dot */}
                    {!n.is_read && (
                      <div style={{
                        position: 'absolute', left: 6, top: '50%',
                        transform: 'translateY(-50%)',
                        width: 5, height: 5, borderRadius: '50%',
                        background: '#00d2ff',
                      }} />
                    )}

                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: cfg.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, color: cfg.color, fontSize: 14,
                    }}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: n.is_read ? 600 : 800,
                        fontSize: 13,
                        color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)',
                        marginBottom: 3,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {n.title}
                      </div>
                      {n.message && (
                        <div style={{
                          fontSize: 11, color: 'var(--text-muted)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          marginBottom: 4,
                        }}>
                          {n.message}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.15)', padding: '4px',
                        borderRadius: 6, flexShrink: 0, alignSelf: 'flex-start',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.15)'}
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                {unread > 0 ? ` · ${unread} unread` : ' · all read'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}