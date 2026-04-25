import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';
import { FaParking, FaSignOutAlt, FaUser, FaBars, FaTimes, FaChevronDown } from 'react-icons/fa';

function Avatar({ name, email, size = 32 }) {
  const letter = (name || email || 'U')[0].toUpperCase();
  const colors = [
    ['#00d2ff','#3a7bd5'], ['#f59e0b','#d97706'],
    ['#10b981','#059669'], ['#8b5cf6','#7c3aed'],
  ];
  const [from, to] = colors[letter.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg,${from},${to})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 900, color: '#001219',
      flexShrink: 0, userSelect: 'none', cursor: 'pointer',
    }}>
      {letter}
    </div>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = user?.role === 'ADMIN'
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/slots',     label: 'Slots'     },
        { to: '/admin',     label: 'Admin'     },
        { to: '/reports',   label: 'Reports'   },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/slots',     label: 'Slots'     },
        { to: '/booking',   label: 'Book'      },
      ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: 'rgba(10,18,40,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 20px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,210,255,0.3)',
          }}>
            <FaParking size={16} color="#001219" />
          </div>
          <span style={{
            fontWeight: 900, fontSize: '1.1rem', letterSpacing: 1,
            background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            SUPRS
          </span>
        </Link>

        {/* Desktop nav */}
        {user && (
          <nav style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}
            className="desktop-nav">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} style={{
                padding: '7px 14px', borderRadius: 10,
                textDecoration: 'none', fontWeight: 700, fontSize: 13,
                color: isActive(l.to) ? '#00d2ff' : 'var(--text-secondary)',
                background: isActive(l.to) ? 'rgba(0,210,255,0.1)' : 'transparent',
                border: `1px solid ${isActive(l.to) ? 'rgba(0,210,255,0.2)' : 'transparent'}`,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { if (!isActive(l.to)) e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { if (!isActive(l.to)) e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {user && <NotificationBell />}

          {user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: userMenuOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '5px 10px 5px 5px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                <Avatar name={user.name} email={user.email} size={28} />
                <span style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
                  maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} className="desktop-only">
                  {user.name || user.email?.split('@')[0]}
                </span>
                <FaChevronDown size={9} color="var(--text-muted)"
                  style={{ transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  minWidth: 180,
                  background: 'rgba(10,18,40,0.97)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                  overflow: 'hidden', zIndex: 9999,
                }}>
                  {/* User info */}
                  <div style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {user.name || 'User'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                      {user.email}
                    </div>
                    <div style={{
                      marginTop: 6, display: 'inline-flex', alignItems: 'center',
                      fontSize: 9, fontWeight: 800,
                      color: user.role === 'ADMIN' ? '#f59e0b' : '#00d2ff',
                      background: user.role === 'ADMIN' ? 'rgba(245,158,11,0.1)' : 'rgba(0,210,255,0.1)',
                      border: `1px solid ${user.role === 'ADMIN' ? 'rgba(245,158,11,0.2)' : 'rgba(0,210,255,0.2)'}`,
                      borderRadius: 99, padding: '2px 8px',
                    }}>
                      {user.role || 'USER'}
                    </div>
                  </div>

                  {/* Menu items */}
                  {[
                    { icon: <FaUser size={12} />, label: 'My Profile', action: () => { navigate('/profile'); setUserMenuOpen(false); } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      style={{
                        width: '100%', padding: '11px 14px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                        color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                        textAlign: 'left', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <span style={{ color: '#00d2ff' }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={handleLogout}
                      style={{
                        width: '100%', padding: '11px 14px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                        color: '#ef4444', fontSize: 13, fontWeight: 700,
                        textAlign: 'left', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <FaSignOutAlt size={12} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button onClick={() => setMobileOpen(o => !o)}
              className="mobile-only"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '8px 10px',
                cursor: 'pointer', color: 'var(--text-secondary)',
                display: 'none',
              }}>
              {mobileOpen ? <FaTimes size={15} /> : <FaBars size={15} />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && user && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, bottom: 0,
          background: 'rgba(10,18,40,0.98)',
          backdropFilter: 'blur(20px)',
          zIndex: 999, padding: '20px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {navLinks.map(l => (
            <Link key={l.to} to={l.to}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: '14px 18px', borderRadius: 14,
                textDecoration: 'none', fontWeight: 700, fontSize: 15,
                color: isActive(l.to) ? '#00d2ff' : 'var(--text-primary)',
                background: isActive(l.to) ? 'rgba(0,210,255,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive(l.to) ? 'rgba(0,210,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}>
              {l.label}
            </Link>
          ))}
          <Link to="/profile" onClick={() => setMobileOpen(false)}
            style={{
              padding: '14px 18px', borderRadius: 14,
              textDecoration: 'none', fontWeight: 700, fontSize: 15,
              color: 'var(--text-primary)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
            <FaUser size={13} color="#00d2ff" /> Profile
          </Link>
          <button onClick={handleLogout}
            style={{
              padding: '14px 18px', borderRadius: 14,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
            <FaSignOutAlt size={13} /> Sign Out
          </button>
        </div>
      )}
    </>
  );
}