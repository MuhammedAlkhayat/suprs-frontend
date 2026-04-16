import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from './services/socket';
import ProtectedLayout from './components/ProtectedLayout';
import NotFound from './pages/NotFound';
import ToastProvider, { useToast } from './components/ToastProvider';

// Lazy pages
const Login      = lazy(() => import('./pages/Login'));
const Register   = lazy(() => import('./pages/Register'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Booking    = lazy(() => import('./pages/Booking'));
const Payment    = lazy(() => import('./pages/Payment'));
const Profile    = lazy(() => import('./pages/Profile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Reports    = lazy(() => import('./pages/Reports'));

function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:16 }}>
      <div className="suprs-spinner" />
      <p style={{ color:'var(--text-muted)', fontSize:13, margin:0 }}>Loading…</p>
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
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
}

// Real-time socket manager — lives inside AuthProvider so it has user context
function SocketManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    socket.emit('join_user', user.id);

    // Live slot updates → patch cache instantly (no refetch needed)
    const onSlotUpdated = (updated) => {
      qc.setQueryData(['slots'], (old) =>
        old ? old.map(s => s.id === updated.id ? { ...s, ...updated } : s) : old
      );
    };

    const onSlotDeleted = ({ id }) => {
      qc.setQueryData(['slots'], (old) => old?.filter(s => s.id !== id) ?? []);
    };

    // Live notifications → prepend to cache + show toast
    const onNotification = (notif) => {
      qc.setQueryData(['notifications'], (old) => [notif, ...(old ?? [])]);
      showToast(notif.title, notif.message, 'info');
    };

    // Live booking events
    const onBookingCreated = () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['slots'] });
    };

    socket.on('slot_updated',    onSlotUpdated);
    socket.on('slot_deleted',    onSlotDeleted);
    socket.on('notification',    onNotification);
    socket.on('booking_created', onBookingCreated);

    return () => {
      socket.off('slot_updated',    onSlotUpdated);
      socket.off('slot_deleted',    onSlotDeleted);
      socket.off('notification',    onNotification);
      socket.off('booking_created', onBookingCreated);
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
          {/* Public */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected shell */}
          <Route path="/" element={
            <PrivateRoute>
              <ProtectedLayout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="booking"     element={<Booking />} />
            <Route path="payment/:id" element={<Payment />} />
            <Route path="profile"     element={<Profile />} />
            <Route path="admin"       element={
              <PrivateRoute adminOnly>
                <AdminPanel />
              </PrivateRoute>
            } />
            <Route path="reports"     element={
              <PrivateRoute adminOnly>
                <Reports />
              </PrivateRoute>
            } />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}