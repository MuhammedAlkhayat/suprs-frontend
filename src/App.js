// src/App.js
import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import socket from './services/socket';
import ProtectedLayout from './components/ProtectedLayout';
import NotFound from './pages/NotFound';
import ToastProvider, { useToast } from './components/ToastProvider';

// Lazy pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Booking = lazy(() => import('./pages/Booking'));
const Payment = lazy(() => import('./pages/Payment'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Reports = lazy(() => import('./pages/Reports'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div className="suprs-spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
        Loading…
      </p>
    </div>
  );
}

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

// Real-time socket manager — runs after auth is available
function SocketManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Ensure socket is connected (attempt to connect if library exposes connect)
    try {
      if (socket && !socket.connected && typeof socket.connect === 'function') {
        socket.connect();
      }
    } catch (err) {
      // don't crash the app if socket.connect fails
      // console.warn('Socket connect failed', err);
    }

    // Join user room / channel (best-effort)
    try {
      if (socket && socket.connected) {
        socket.emit('join_user', user.id);
      } else if (socket && typeof socket.emit === 'function') {
        // emit anyway — some socket clients queue emits until connected
        socket.emit('join_user', user.id);
      }
    } catch (err) {
      // swallow emit errors
    }

    // Helper to extract id from different payload shapes
    const extractId = (payload) =>
      payload?.slot_id ?? payload?.id ?? payload?.slotId ?? payload?.booking_id ?? null;

    const onSlotUpdated = (payload) => {
      const id = extractId(payload);
      // conservative: invalidate slots list so UI stays correct
      qc.invalidateQueries({ queryKey: ['slots'] });

      // update single-slot cache if present for a smoother UI
      if (id) {
        // update slots list entry if present
        qc.setQueryData(['slots'], (old) =>
          old ? old.map((s) => (s.id === id ? { ...s, ...(payload || {}) } : s)) : old
        );
        // set single slot cache
        qc.setQueryData(['slot', String(id)], (old) =>
          old ? { ...old, ...(payload || {}) } : old
        );
      }
    };

    const onSlotDeleted = (payload) => {
      const id = extractId(payload);
      qc.invalidateQueries({ queryKey: ['slots'] });
      if (id) {
        qc.setQueryData(['slots'], (old) => old?.filter((s) => s.id !== id) ?? []);
        qc.setQueryData(['slot', String(id)], () => undefined);
      }
    };

    const onBookingCreated = (payload) => {
      // payload might include booking_id or message/title
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['slots'] });
      try {
        const title = payload?.title ?? 'Booking Created';
        const message = payload?.message ?? (payload?.booking_id ? `Booking ${payload.booking_id} created` : 'New booking created');
        showToast?.(title, message, 'info');
      } catch (err) {
        // ignore toast errors
      }
    };

    const onNotification = (notif) => {
      qc.setQueryData(['notifications'], (old) => [notif, ...(old ?? [])]);
      try {
        showToast?.(notif.title, notif.message, 'info');
      } catch (err) {
        // ignore toast errors
      }
    };

    // Register both legacy and canonical event names for compatibility
    socket.on?.('slot_update', onSlotUpdated);    // legacy
    socket.on?.('slot_updated', onSlotUpdated);   // canonical
    socket.on?.('slot_deleted', onSlotDeleted);
    socket.on?.('booking_created', onBookingCreated);
    socket.on?.('notification', onNotification);

    // Optional: refresh when tab gains focus to ensure user sees latest slots
    const handleFocus = () => qc.invalidateQueries({ queryKey: ['slots'] });
    window.addEventListener('focus', handleFocus);

    return () => {
      try {
        socket.off?.('slot_update', onSlotUpdated);
        socket.off?.('slot_updated', onSlotUpdated);
        socket.off?.('slot_deleted', onSlotDeleted);
        socket.off?.('booking_created', onBookingCreated);
        socket.off?.('notification', onNotification);
      } catch (err) {
        // ignore cleanup errors
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, qc, showToast]);

  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <ScrollToTop />
      <SocketManager />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

          {/* Protected shell: ProtectedLayout should render an <Outlet /> */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <ProtectedLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Regular authenticated routes */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Booking UI */}
            <Route path="booking" element={<Booking />} />
            <Route path="booking/:slotId?" element={<Booking />} />

            {/* Alias: show slots/dashboard for /slots */}
            <Route path="slots" element={<Dashboard />} />

            <Route path="payment/:id" element={<Payment />} />
            <Route path="profile" element={<Profile />} />

            {/* Admin-only routes */}
            <Route
              path="admin"
              element={
                <PrivateRoute adminOnly={true}>
                  <AdminPanel />
                </PrivateRoute>
              }
            />
            <Route
              path="admin/slots"
              element={
                <PrivateRoute adminOnly={true}>
                  <AdminPanel />
                </PrivateRoute>
              }
            />
            <Route
              path="reports"
              element={
                <PrivateRoute adminOnly={true}>
                  <Reports />
                </PrivateRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}
