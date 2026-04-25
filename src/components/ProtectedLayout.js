import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.innerWidth < 1200
  );
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Responsive collapse
  useEffect(() => {
    const handler = () => setSidebarCollapsed(window.innerWidth < 1200);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(6,13,26,0.7)',
            backdropFilter:'blur(4px)', zIndex:'var(--z-overlay)' }} />
      )}

      <Header
        onMenuClick={() => setSidebarOpen(o => !o)}
        onCollapseClick={() => setSidebarCollapsed(c => !c)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={`suprs-main${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
