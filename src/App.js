// src/App.js
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedLayout from './components/ProtectedLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import AdminPanel from './pages/AdminPanel';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Diagram Pages
import UseCaseDiagram from './pages/diagrams/UseCaseDiagram';
import ClassDiagram from './pages/diagrams/ClassDiagram';
import ActivityDiagram from './pages/diagrams/ActivityDiagram';
import ERDiagram from './pages/diagrams/ERDiagram';

import socket from './services/socket';

function CleanupOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    const removed = [];

    const overlaySelectors = [
      '.loading-overlay',
      '.page-overlay',
      '.app-overlay',
      '.suspense-fallback',
      '.dark-overlay',
      '.modal-backdrop',
      '.ReactModal__Overlay',
      '.overlay',
      '.backdrop',
      '.fade.show',
      '.ant-modal-root',
      '.MuiBackdrop-root'
    ];

    overlaySelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        try {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          const covers = rect.width >= window.innerWidth - 2 && rect.height >= window.innerHeight - 2;
          const opaque = /rgba|rgb/.test(style.backgroundColor || '') && (style.backgroundColor.includes('0.5') || style.opacity > 0.15);
          if (covers || opaque || parseInt(style.zIndex || '0') >= 900) {
            removed.push({ selector: sel, node: el });
            el.remove();
          }
        } catch (e) {
          removed.push({ selector: sel, node: el });
          el.remove();
        }
      });
    });

    document.querySelectorAll('body > *').forEach(el => {
      try {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'absolute') {
          const rect = el.getBoundingClientRect();
          const isFull = rect.width >= window.innerWidth - 2 && rect.height >= window.innerHeight - 2;
          const z = parseInt(style.zIndex || '0', 10) || 0;
          if (isFull && z > 500) {
            removed.push({ selector: 'body > * (fixed-full)', node: el });
            el.remove();
          }
        }
      } catch (e) {}
    });

    const staleBodyClasses = [
      'modal-open',
      'overlay-open',
      'dark-overlay-open',
      'suspense-active',
      'loading-active',
      'page-overlay',
      'ReactModal__Body--open'
    ];
    staleBodyClasses.forEach(cls => {
      if (document.body.classList.contains(cls)) {
        document.body.classList.remove(cls);
        removed.push({ selector: `body.class:${cls}`, node: null });
      }
    });

    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
      removed.push({ selector: 'body.style.overflow', node: null });
    }
    document.body.style.pointerEvents = '';

    document.querySelectorAll('main, .main-content, .app-content, #root > *').forEach(el => {
      try {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.filter = 'none';
        el.style.pointerEvents = 'auto';
      } catch (e) {}
    });

    if (removed.length > 0) {
      console.info('[RouteCleanup] removed overlay artifacts after route:', location.pathname);
      removed.forEach((r, i) => console.info(`[RouteCleanup][${i}]`, r.selector, r.node));
    }

    const id = setTimeout(() => {
      document.querySelectorAll('body > *').forEach(el => {
        try {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          if ((style.position === 'fixed' || style.position === 'absolute') &&
             rect.width >= window.innerWidth - 2 && rect.height >= window.innerHeight - 2 &&
             parseInt(style.zIndex || '0', 10) > 500) {
            console.info('[RouteCleanup] delayed remove', el);
            el.remove();
          }
        } catch (e) {}
      });

      document.querySelectorAll('main, .main-content, .app-content, #root > *').forEach(el => {
        try {
          el.style.opacity = '1';
          el.style.visibility = 'visible';
          el.style.filter = 'none';
          el.style.pointerEvents = 'auto';
        } catch (e) {}
      });
    }, 250);

    return () => clearTimeout(id);
  }, [location]);

  return null;
}

function PrivateRoute() {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <ProtectedLayout><Outlet /></ProtectedLayout>;
}

function App() {
  const queryClient = useQueryClient();

  useEffect(() => {
    function onBookingCreated() {
      queryClient.invalidateQueries(['slots']);
    }

    socket.on('booking:created', onBookingCreated);
    return () => {
      socket.off('booking:created', onBookingCreated);
    };
  }, [queryClient]);

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />

        <CleanupOnRouteChange />

        <div style={{ flex: 1, position: 'relative' }}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/diagrams/usecase" element={<UseCaseDiagram />} />
              <Route path="/diagrams/class" element={<ClassDiagram />} />
              <Route path="/diagrams/activity" element={<ActivityDiagram />} />
              <Route path="/diagrams/er" element={<ERDiagram />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}

export default App;