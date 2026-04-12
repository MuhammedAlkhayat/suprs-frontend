// src/components/Header.js
import React from 'react';
import { FaBars } from 'react-icons/fa';

export default function Header() {
  const handleToggleSidebar = () => {
    // Toggle body class for layout shift (used by index.css)
    const cls = 'sidebar-collapsed';
    if (document.body.classList.contains(cls)) {
      document.body.classList.remove(cls);
    } else {
      document.body.classList.add(cls);
    }

    // Dispatch a custom event so Sidebar can sync its internal state
    window.dispatchEvent(new CustomEvent('toggleSidebar'));
  };

  return (
    <header
      style={{
        height: 'var(--header-height, 70px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        background: 'transparent'
      }}
    >
      {/* Hamburger: visible on all sizes; hide by CSS on very large screens if you prefer */}
      <button
        onClick={handleToggleSidebar}
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          fontSize: 18,
          cursor: 'pointer',
          padding: 8,
          borderRadius: 6
        }}
      >
        <FaBars />
      </button>

      {/* The rest of your header (logo, nav, logout button, etc.) */}
      <div style={{ flex: 1 }} aria-hidden="true">
        {/* your header content */}
      </div>
    </header>
  );
}