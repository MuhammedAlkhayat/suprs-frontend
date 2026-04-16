import React, { useState, useRef, useEffect } from 'react';
import { FaBars, FaBell, FaUserCircle, FaSignOutAlt, FaParking } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAllNotificationsRead } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import styled from 'styled-components';

const HeaderBar = styled.header`
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--header-height, 70px);
  background: rgba(8, 10, 15, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  z-index: 1300;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  font-size: 1.1rem;
  color: #00d2ff;
  flex: 1;
`;

const IconBtn = styled.button`
  background: transparent !important;
  border: none !important;
  color: #cbd5e1 !important;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  position: relative;
  transition: color 0.2s, background 0.2s !important;
  &:hover { background: rgba(255,255,255,0.06) !important; color: #fff !important; }
`;

const Badge = styled.span`
  position: absolute;
  top: 4px; right: 4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 50%;
  width: 16px; height: 16px;
  display: flex; align-items: center; justify-content: center;
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: #1e293b;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  z-index: 9999;
  overflow: hidden;
  max-height: 400px;
  overflow-y: auto;
`;

const NotifItem = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: ${p => p.$unread ? 'rgba(0,210,255,0.05)' : 'transparent'};
  cursor: pointer;
  &:hover { background: rgba(255,255,255,0.04); }
`;

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!localStorage.getItem('token'),
    refetchInterval: 30000,
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggleSidebar = () => window.dispatchEvent(new CustomEvent('toggleSidebar'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <HeaderBar>
      <IconBtn onClick={handleToggleSidebar} aria-label="Toggle sidebar">
        <FaBars />
      </IconBtn>

      <Logo>
        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#001219', fontWeight: 900, fontSize: 14 }}>
          <FaParking />
        </div>
        SUPRS
      </Logo>

      {/* Notification Bell */}
      <div style={{ position: 'relative' }} ref={notifRef}>
        <IconBtn onClick={() => setNotifOpen(o => !o)} aria-label="Notifications">
          <FaBell />
          {unreadCount > 0 && <Badge>{unreadCount > 9 ? '9+' : unreadCount}</Badge>}
        </IconBtn>

        {notifOpen && (
          <Dropdown>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>Notifications</span>
              {unreadCount > 0 && (
                <button onClick={() => markAllMutation.mutate()} style={{ background: 'transparent !important', border: 'none', color: '#00d2ff', fontSize: 12, cursor: 'pointer', padding: '2px 6px' }}>
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No notifications yet</div>
            ) : (
              notifications.slice(0, 15).map(n => (
                <NotifItem key={n.id} $unread={!n.is_read}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#f8fafc' }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{formatTime(n.created_at)}</div>
                </NotifItem>
              ))
            )}
          </Dropdown>
        )}
      </div>

      {/* User info */}
      <IconBtn onClick={() => navigate('/profile')} aria-label="Profile">
        <FaUserCircle />
      </IconBtn>

      <span style={{ color: '#94a3b8', fontSize: 13, display: 'none', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        className="d-none d-md-inline">
        {user?.email?.split('@')[0]}
      </span>

      <IconBtn onClick={handleLogout} aria-label="Logout" title="Logout">
        <FaSignOutAlt />
      </IconBtn>
    </HeaderBar>
  );
}