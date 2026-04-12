// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect, useLocation } from 'react-router-dom';
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

function CleanupOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    const removed = [];

    // 1) Remove known overlay selectors (adjust this list if you have custom names)
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
      '.ant-modal-root', // if using antd
      '.MuiBackdrop-root' // if using MUI
    ];

    overlaySelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        // Heuristic: remove if it covers viewport or is semi-opaque
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

    // 2) Defensive removal: any fixed element that covers viewport with very high z-index
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
      } catch (e) {
        // ignore
      }
    });

    // 3) Remove common body classes left by modal libraries or loaders
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

    // 4) Restore body styles that may block interactions
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
      removed.push({ selector: 'body.style.overflow', node: null });
    }
    document.body.style.pointerEvents = '';

    // 5) Defensive: restore visibility/opacity/filter on main/root children
    // This ensures any element left with inline styles or animations doesn't stay dimmed.
    document.querySelectorAll('main, .main-content, .app-content, #root > *').forEach(el => {
      try {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.filter = 'none';
        el.style.pointerEvents = 'auto';
      } catch (e) {}
    });

    // Debug: log what we removed so you can trace the source component
    if (removed.length > 0) {
      console.info('[RouteCleanup] removed overlay artifacts after route:', location.pathname);
      removed.forEach((r, i) => {
        console.info(`[RouteCleanup][${i}]`, r.selector, r.node);
      });
    }

    // optional: small delay re-check to catch overlays added synchronously after route change
    const id = setTimeout(() => {
      // re-run a single lightweight check: if body still has a full-screen fixed child, remove it
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

      // delayed defensive restore in case an animation just finished setting inline styles
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

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />

        {/* route-change cleanup runs inside Router so useLocation works */}
        <CleanupOnRouteChange />

        <div style={{ flex: 1, position: 'relative' }}>
          <Switch>
            <Route exact path="/login" component={Login} />

            {/* Protected routes */}
            <PrivateRoute path="/dashboard" component={Dashboard} />
            <PrivateRoute path="/booking" component={Booking} />
            <PrivateRoute path="/payment" component={Payment} />
            <PrivateRoute path="/admin" component={AdminPanel} />
            <PrivateRoute path="/reports" component={Reports} />
            <PrivateRoute path="/profile" component={Profile} />

            {/* Diagram routes */}
            <PrivateRoute path="/diagrams/usecase" component={UseCaseDiagram} />
            <PrivateRoute path="/diagrams/class" component={ClassDiagram} />
            <PrivateRoute path="/diagrams/activity" component={ActivityDiagram} />
            <PrivateRoute path="/diagrams/er" component={ERDiagram} />

            <Route exact path="/">
              <Redirect to="/login" />
            </Route>
            <Route component={NotFound} />
          </Switch>
        </div>

        <Footer />
      </div>
    </Router>
  );
}

// PrivateRoute unchanged
function PrivateRoute({ component: Component, ...rest }) {
  return (
    <Route {...rest} render={props => (
      localStorage.getItem('token')
        ? (
          <ProtectedLayout>
            <Component {...props} />
          </ProtectedLayout>
        )
        : <Redirect to="/login" />
    )} />
  );
}

export default App;