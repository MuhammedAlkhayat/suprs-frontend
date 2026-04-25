// src/components/NotificationBell.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { gsap } from 'gsap';
import {
  FaBell,
  FaCheckDouble,
  FaTrash,
  FaParking,
  FaCreditCard,
  FaTimes,
  FaInfoCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';
import './NotificationBell.css';

const TYPE_CONFIG = {
  BOOKING: {
    icon: <FaParking size={13} />,
    color: '#00d2ff',
    bg: 'rgba(0,210,255,0.1)',
  },
  PAYMENT: {
    icon: <FaCreditCard size={13} />,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
  },
  CANCEL: {
    icon: <FaTimes size={13} />,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
  },
  ALERT: {
    icon: <FaExclamationTriangle size={13} />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  WELCOME: {
    icon: '👋',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
  },
  INFO: {
    icon: <FaInfoCircle size={13} />,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.1)',
  },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDateTime(dt) {
  if (!dt) return '-';
  try {
    const d = new Date(dt);
    return d.toLocaleString();
  } catch {
    return dt;
  }
}

export default function NotificationBell({
  className = '',
  onSelectNotification = () => {},
}) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);
  const panelRef = useRef(null);
  const dotRef = useRef(null);

  // bookingDetailsCache: { [bookingId]: { loading, data, error, open } }
  const [bookingDetailsCache, setBookingDetailsCache] = useState({});

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unread = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('suprs-token');
    if (!token) return;

    let socket;
    try {
      const { io } = require('socket.io-client');
      socket = io(process.env.REACT_APP_API_URL || 'https://suprs-backend.onrender.com', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        socket.emit('join', `user_${user.id}`);
      });

      socket.on('notification', (notif) => {
        qc.setQueryData(['notifications', user.id], (old = []) => [
          {
            ...notif,
            id: notif.id ?? Date.now(),
            is_read: false,
            created_at: notif.created_at ?? new Date().toISOString(),
          },
          ...old,
        ]);

        if (bellRef.current) {
          gsap.to(bellRef.current, {
            keyframes: [
              { rotation: -20, duration: 0.08 },
              { rotation: 20, duration: 0.08 },
              { rotation: -15, duration: 0.08 },
              { rotation: 15, duration: 0.08 },
              { rotation: 0, duration: 0.1 },
            ],
          });
        }
        if (dotRef.current) {
          gsap.fromTo(dotRef.current, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
        }
      });
    } catch (e) {
      // Socket optional
    }

    return () => socket?.disconnect();
  }, [user, qc]);

  useEffect(() => {
    if (open && panelRef.current) {
      gsap.fromTo(panelRef.current, { opacity: 0, y: -8, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out' });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!panelRef.current?.contains(e.target) && !bellRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: (_, id) => {
      qc.setQueryData(['notifications', user?.id], (old = []) =>
        old.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      qc.setQueryData(['notifications', user?.id], (old = []) =>
        old.map((n) => ({ ...n, is_read: true }))
      );
    },
  });

  const deleteNotif = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: (_, id) => {
      qc.setQueryData(['notifications', user?.id], (old = []) =>
        old.filter((n) => n.id !== id)
      );
      // remove cached booking details for safety
      setBookingDetailsCache((prev) => {
        const copy = { ...prev };
        Object.keys(copy).forEach((k) => {
          if (copy[k]?.notifId === id) delete copy[k];
        });
        return copy;
      });
    },
  });

  const clearAll = useMutation({
    mutationFn: () => api.delete('/notifications/clear-all'),
    onSuccess: () => {
      qc.setQueryData(['notifications', user?.id], []);
      setBookingDetailsCache({});
    },
  });

  // Toggle expand / fetch booking details on demand
  const toggleBookingSummary = useCallback(
    async (notif) => {
      if (!notif) return;
      const bookingId =
        notif.booking_id ??
        notif.bookingId ??
        notif.meta?.booking_id ??
        notif.meta?.bookingId ??
        notif.data?.booking_id ??
        notif.data?.bookingId ??
        notif.payload?.booking_id ??
        notif.payload?.bookingId;

      if (!bookingId) {
        // fallback: call parent navigation
        try { onSelectNotification(notif); } catch {}
        return;
      }

      setBookingDetailsCache((prev) => {
        const existing = prev[bookingId];
        // if we have data, just toggle open flag
        if (existing && existing.data) {
          return { ...prev, [bookingId]: { ...existing, open: !existing.open } };
        }
        // otherwise create a loading placeholder
        return { ...prev, [bookingId]: { loading: true, data: null, error: null, open: true, notifId: notif.id } };
      });

      // if we already had data, nothing more to do
      if (bookingDetailsCache[bookingId]?.data) return;

      try {
        // NOTE: adjust path if your API route differs
        const res = await api.get(`/bookings/${bookingId}`);
        const data = res?.data ?? res;
        setBookingDetailsCache((prev) => ({ ...prev, [bookingId]: { loading: false, data, error: null, open: true, notifId: notif.id } }));
      } catch (err) {
        setBookingDetailsCache((prev) => ({ ...prev, [bookingId]: { loading: false, data: null, error: err?.message ?? 'Failed', open: true, notifId: notif.id } }));
      }
    },
    [bookingDetailsCache, onSelectNotification]
  );

  // when user clicks an item: mark read (if needed) and call parent's handler to navigate
  const handleItemClick = useCallback(
    (n) => {
      if (!n) return;
      if (!n.is_read) markRead.mutate(n.id);
      try { onSelectNotification(n); } catch (e) { /* ignore parent errors */ }
      setOpen(false);
    },
    [markRead, onSelectNotification]
  );

  if (!user) return null;

  return (
    <div className={`notif-root ${className}`.trim()}>
      <button
        ref={bellRef}
        onClick={() => setOpen((o) => !o)}
        className={`notif-bell-btn ${open ? 'open' : ''}`}
        aria-label="Open notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <FaBell size={16} />
        {unread > 0 && <span ref={dotRef} className="notif-bell-dot" />}
      </button>

      {open && (
        <div ref={panelRef} className="notif-panel" role="dialog" aria-label="Notifications">
          <div className="notif-panel-header">
            <div className="notif-panel-title">
              <FaBell size={14} color="#00d2ff" />
              <span>Notifications</span>
              {unread > 0 && <span className="notif-badge">{unread}</span>}
            </div>

            <div className="notif-panel-actions">
              {unread > 0 && (
                <button className="notif-action-btn mark-read" onClick={() => markAllRead.mutate()}>
                  <FaCheckDouble size={11} /> All Read
                </button>
              )}

              {notifications.length > 0 && (
                <button className="notif-action-btn clear-all" onClick={() => clearAll.mutate()}>
                  <FaTrash size={11} /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <FaBell size={32} className="notif-empty-icon" />
                <div className="notif-empty-title">All caught up!</div>
                <div className="notif-empty-sub">No notifications yet</div>
              </div>
            ) : (
              notifications.map((n, i) => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
                const bookingId =
                  n.booking_id ??
                  n.bookingId ??
                  n.meta?.booking_id ??
                  n.meta?.bookingId ??
                  n.data?.booking_id ??
                  n.data?.bookingId ??
                  n.payload?.booking_id ??
                  n.payload?.bookingId;

                const bookingCache = bookingId ? bookingDetailsCache[bookingId] : null;

                return (
                  <div key={n.id ?? i}>
                    <div
                      onClick={() => handleItemClick(n)}
                      className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                          handleItemClick(n);
                        }
                      }}
                    >
                      {!n.is_read && <div className="notif-unread-dot" />}

                      <div className="notif-icon" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.icon}
                      </div>

                      <div className="notif-content" aria-hidden>
                        <div className="notif-title">{n.title}</div>
                        {n.message && <div className="notif-message">{n.message}</div>}
                        <div className="notif-time" style={{ color: cfg.color }}>{timeAgo(n.created_at)}</div>
                      </div>

                      {/* For booking notifications: toggle inline summary */}
                      {n.type === 'BOOKING' && (
                        <button
                          className="notif-view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            // toggle and fetch details
                            toggleBookingSummary(n);
                            // mark read
                            if (!n.is_read) markRead.mutate(n.id);
                          }}
                          aria-expanded={bookingCache ? !!bookingCache.open : false}
                          aria-controls={bookingId ? `booking-summary-${bookingId}` : undefined}
                        >
                          {bookingCache?.open ? 'Hide' : 'View'}
                        </button>
                      )}

                      <button
                        className="notif-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotif.mutate(n.id);
                        }}
                        aria-label="Delete notification"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>

                    {/* Expanded booking summary (if open) */}
                    {bookingId && bookingDetailsCache[bookingId]?.open && (
                      <div id={`booking-summary-${bookingId}`} className="notif-booking-summary" role="region" aria-label="Booking summary">
                        {bookingDetailsCache[bookingId].loading ? (
                          <div className="notif-booking-loading">Loading booking...</div>
                        ) : bookingDetailsCache[bookingId].error ? (
                          <div className="notif-booking-error">Failed to load booking</div>
                        ) : bookingDetailsCache[bookingId].data ? (
                          (() => {
                            const b = bookingDetailsCache[bookingId].data;
                            // adapt to your booking payload fields
                            const slot = b.slot?.name ?? b.slot_name ?? b.slotNumber ?? '—';
                            const vehicle = b.vehicle?.license ?? b.vehicle?.plate ?? b.vehicle ?? '—';
                            const startAt = b.start_at ?? b.startTime ?? b.start ?? null;
                            const endAt = b.end_at ?? b.endTime ?? b.end ?? null;
                            const status = b.status ?? '—';
                            return (
                              <div className="notif-booking-body">
                                <div className="booking-row">
                                  <div className="booking-label">Slot</div>
                                  <div className="booking-value">{slot}</div>
                                </div>
                                <div className="booking-row">
                                  <div className="booking-label">When</div>
                                  <div className="booking-value">
                                    {formatDateTime(startAt)}{endAt ? ` — ${formatDateTime(endAt)}` : ''}
                                  </div>
                                </div>
                                <div className="booking-row">
                                  <div className="booking-label">Vehicle</div>
                                  <div className="booking-value">{vehicle}</div>
                                </div>
                                <div className="booking-row">
                                  <div className="booking-label">Status</div>
                                  <div className="booking-value">{String(status).toUpperCase()}</div>
                                </div>

                                <div className="booking-actions">
                                  <button
                                    className="notif-action-btn open-booking"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      try { onSelectNotification(n); } catch {}
                                      setOpen(false);
                                    }}
                                  >
                                    Open
                                  </button>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="notif-booking-empty">No booking details available</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notif-panel-footer">
              <span>
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

NotificationBell.propTypes = {
  className: PropTypes.string,
  onSelectNotification: PropTypes.func,
};