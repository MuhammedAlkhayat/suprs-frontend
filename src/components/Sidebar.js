// src/components/Sidebar.js
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  FaTachometerAlt,
  FaParking,
  FaUser,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaTimes,
} from 'react-icons/fa';
import PropTypes from 'prop-types';
import './Sidebar.css';

const NAV = [
  { to: '/dashboard', icon: <FaTachometerAlt size={17} />, label: 'Dashboard' },
  { to: '/booking', icon: <FaParking size={17} />, label: 'Book a Slot' },
  { to: '/profile', icon: <FaUser size={17} />, label: 'My Profile' },
];

const ADMIN_NAV = [
  { to: '/admin', icon: <FaCog size={17} />, label: 'Admin Panel' },
  { to: '/reports', icon: <FaChartBar size={17} />, label: 'Reports' },
];

const TOGGLE_EVENT = 'toggleSidebar';

export default function Sidebar({ collapsed = false, mobileOpen, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = typeof mobileOpen === 'boolean';
  const panelOpen = controlled ? mobileOpen : internalOpen;

  useEffect(() => {
    // add/remove body class for easier CSS control and debugging
    if (panelOpen) {
      document.body.classList.add('suprs-panel-open');
    } else {
      document.body.classList.remove('suprs-panel-open');
    }
  }, [panelOpen]);

  useEffect(() => {
    function handleToggle() {
      console.log('Sidebar: received toggleSidebar event, controlled=', controlled, 'panelOpen before=', panelOpen);
      if (controlled) {
        onClose(); // parent should toggle
      } else {
        setInternalOpen((prev) => !prev);
      }
    }

    window.addEventListener(TOGGLE_EVENT, handleToggle);
    return () => window.removeEventListener(TOGGLE_EVENT, handleToggle);
  }, [controlled, onClose, panelOpen]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && panelOpen) {
        if (controlled) onClose();
        else setInternalOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [panelOpen, controlled, onClose]);

  function closePanel() {
    if (controlled) onClose();
    else setInternalOpen(false);
  }

  function handleNavClick() {
    closePanel();
  }

  function handleLogout() {
    logout?.();
    navigate('/login');
    closePanel();
  }

  const sidebarClassName = [
    'suprs-sidebar',
    collapsed ? 'collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Docked sidebar */}
      <nav className={sidebarClassName} aria-label="Primary navigation">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>

          {!collapsed && (
            <div className="sidebar-user-meta">
              <div className="sidebar-user-name">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="sidebar-user-role">
                {user?.role || 'USER'}
              </div>
            </div>
          )}
        </div>

       

        <div className="sidebar-links">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
              title={collapsed ? item.label : undefined}
              onClick={handleNavClick}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}

          {user?.role === 'ADMIN' && (
            <>
              <div className="sidebar-divider" />
              {!collapsed && (
                <div className="sidebar-section-label">Admin</div>
              )}

              {ADMIN_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-nav-item${isActive ? ' active' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                  onClick={handleNavClick}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </div>

        <div className="sidebar-spacer" />

        <div className="sidebar-bottom">
          <button
            onClick={handleLogout}
            className="sidebar-nav-item signout"
            title={collapsed ? 'Sign Out' : undefined}
            type="button"
          >
            <span className="nav-icon">
              <FaSignOutAlt size={17} />
            </span>
            <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Phone-style panel that opens on desktop too */}
      <aside
        className={`suprs-mobile-panel ${panelOpen ? 'open' : ''}`}
        role="dialog"
        aria-hidden={!panelOpen}
        aria-label="Menu"
      >
        <div className="mobile-panel-inner">
          <div className="mobile-panel-top">
            <div className="mobile-panel-brand">
              <div className="mobile-panel-avatar">
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="mobile-panel-title">SUPRS</div>
            </div>

            <button
              type="button"
              className="mobile-panel-close"
              onClick={closePanel}
              aria-label="Close menu"
            >
              <FaTimes />
            </button>
          </div>

          <nav className="mobile-panel-nav" aria-label="Menu navigation">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `mobile-panel-link${isActive ? ' active' : ''}`
                }
                onClick={handleNavClick}
              >
                <span className="mobile-icon">{item.icon}</span>
                <span className="mobile-text">{item.label}</span>
              </NavLink>
            ))}

            {user?.role === 'ADMIN' && (
              <>
                <div className="mobile-divider" />
                {ADMIN_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `mobile-panel-link${isActive ? ' active' : ''}`
                    }
                    onClick={handleNavClick}
                  >
                    <span className="mobile-icon">{item.icon}</span>
                    <span className="mobile-text">{item.label}</span>
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          <div className="mobile-panel-cta">
            <button
              type="button"
              onClick={handleLogout}
              className="mobile-signout"
            >
              <FaSignOutAlt />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      <div
        className={`suprs-mobile-backdrop ${panelOpen ? 'show' : ''}`}
        onClick={closePanel}
        aria-hidden={!panelOpen}
      />
    </>
  );
}

Sidebar.propTypes = {
  collapsed: PropTypes.bool,
  mobileOpen: PropTypes.bool,
  onClose: PropTypes.func,
};
