// src/components/Header.js
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import {
  FaSignOutAlt,
  FaUser,
  FaBars,
  FaTimes,
  FaChevronDown,
} from 'react-icons/fa';
import './Header.css';

function Avatar({ name, email, size = 32 }) {
  const letter = (name || email || 'U')[0].toUpperCase();
  const colors = [
    ['#00d2ff', '#3a7bd5'],
    ['#f59e0b', '#d97706'],
    ['#10b981', '#059669'],
    ['#8b5cf6', '#7c3aed'],
  ];
  const [from, to] = colors[letter.charCodeAt(0) % colors.length];

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg,${from},${to})`,
      }}
      aria-hidden="true"
      title={name || email || 'User'}
    >
      {letter}
    </div>
  );
}

Avatar.propTypes = {
  name: PropTypes.string,
  email: PropTypes.string,
  size: PropTypes.number,
};

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark'
  );

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(
        document.documentElement.getAttribute('data-theme') === 'light'
          ? 'light'
          : 'dark'
      );
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target) &&
        userMenuOpen
      ) {
        setUserMenuOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setMobileOpen(false);
      }
    }

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

  const base = process.env.PUBLIC_URL || '';
  const logoLight = `${base}/logo-light.png`;
  const logoDark = `${base}/logo-dark.png`;
  const logoDefault = `${base}/logo.png`;
  const logoSrc = theme === 'light' ? logoLight : logoDark;

  function handleLogoError(e) {
    const img = e.currentTarget;
    if (!img.dataset.fallbackTried) {
      img.dataset.fallbackTried = '1';
      img.src = logoDefault;
    } else {
      img.style.display = 'none';
    }
  }

  const navLinks =
    user?.role === 'ADMIN'
      ? [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/slots', label: 'Slots' },
          { to: '/admin', label: 'Admin' },
          { to: '/reports', label: 'Reports' },
        ]
      : [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/slots', label: 'Slots' },
          { to: '/booking', label: 'Book a Slot' },
        ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout?.();
    navigate('/login');
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  // Notification click handler: try to find a booking id in the notification payload and navigate there.
  function handleNotificationSelect(n) {
    if (!n) return;
    // common fields where a booking id might live
    const bookingId =
      n.booking_id ??
      n.bookingId ??
      n.meta?.booking_id ??
      n.meta?.bookingId ??
      n.data?.booking_id ??
      n.data?.bookingId ??
      n.payload?.booking_id ??
      n.payload?.bookingId;

    // if the notification includes a url, prefer that
    const url = n.url ?? n.meta?.url ?? n.data?.url;

    if (bookingId) {
      // navigate to your booking detail route - adjust path if different
      navigate(`/bookings/${bookingId}`);
    } else if (url && typeof url === 'string') {
      // if url is internal, use navigate; if external, open a new tab
      if (url.startsWith('/')) navigate(url);
      else window.open(url, '_blank');
    } else {
      // fallback: open the notifications / bookings page
      navigate('/booking');
    }
    // close menus if open
    setMobileOpen(false);
    setUserMenuOpen(false);
  }

  return (
    <>
      <header className="suprs-header header-root">
        <Link to="/dashboard" className="logo-link" aria-label="Go to dashboard">
          <div className="logo-mark">
            <img
              src={logoSrc}
              alt="SUPRS"
              onError={handleLogoError}
              className="logo-img"
            />
          </div>
          <span className="logo-title">SUPRS</span>
        </Link>

        {user && (
          <nav className="header-nav header-desktop-only">
            <div className="nav-inner">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`nav-link ${isActive(l.to) ? 'active' : ''}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        )}

        <div className="header-actions">
          {user && (
            <NotificationBell
              className="notification"
              onSelectNotification={handleNotificationSelect}
            />
          )}

          <div className="theme-wrap">
            <ThemeToggle />
          </div>

          {user && (
            <div className={`user-area ${userMenuOpen ? 'open' : ''}`} ref={userMenuRef}>
              <button
                className={`user-button ${userMenuOpen ? 'open' : ''}`}
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                <Avatar name={user.name} email={user.email} size={28} />
                <span className="user-name header-desktop-only">
                  {user.name || user.email?.split('@')?.[0]}
                </span>
                <FaChevronDown className="chev" aria-hidden="true" />
              </button>

              <div className={`user-menu ${userMenuOpen ? 'show' : ''}`} role="menu">
                <div className="user-info">
                  <div className="user-info-name">{user.name || 'User'}</div>
                  <div className="user-info-email">{user.email}</div>
                  <div className={`user-role ${user.role === 'ADMIN' ? 'admin' : 'user'}`}>
                    {user.role || 'USER'}
                  </div>
                </div>

                <button
                  className="user-menu-item"
                  onClick={() => {
                    navigate('/profile');
                    setUserMenuOpen(false);
                  }}
                >
                  <FaUser className="menu-icon" /> My Profile
                </button>

                <div className="menu-divider" />

                <button className="user-menu-item signout" onClick={handleLogout}>
                  <FaSignOutAlt className="menu-icon" /> Sign Out
                </button>
              </div>
            </div>
          )}

          {user && (
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="mobile-toggle header-mobile-only"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FaTimes /> : <FaBars />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div className={`mobile-menu ${mobileOpen && user ? 'show' : ''}`}>
        {navLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            onClick={() => setMobileOpen(false)}
            className={`mobile-nav-link ${isActive(l.to) ? 'active' : ''}`}
          >
            {l.label}
          </Link>
        ))}

        <Link to="/profile" onClick={() => setMobileOpen(false)} className="mobile-nav-link">
          <FaUser className="menu-icon" /> Profile
        </Link>

        <button className="mobile-nav-link signout" onClick={handleLogout}>
          <FaSignOutAlt className="menu-icon" /> Sign Out
        </button>
      </div>
    </>
  );
}
