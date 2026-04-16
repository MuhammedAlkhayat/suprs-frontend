import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt, FaTicketAlt, FaCreditCard,
  FaUserShield, FaChartLine, FaUser, FaTimes
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

const SidebarContainer = styled.nav`
  width: ${p => (p.$collapsed ? '64px' : '220px')};
  min-width: ${p => (p.$collapsed ? '64px' : '220px')};
  background: rgba(8,10,15,0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  padding: 14px 8px;
  position: fixed;
  left: 0;
  top: var(--header-height, 70px);
  height: calc(100vh - var(--header-height, 70px));
  z-index: 1200;
  border-right: 1px solid rgba(255,255,255,0.05);
  transition: width 0.22s ease, transform 0.22s ease;
  overflow-y: auto;
  overflow-x: hidden;

  @media (max-width: 900px) {
    transform: ${p => (p.$mobileOpen ? 'translateX(0)' : 'translateX(-100%)')};
    width: 240px;
    min-width: 240px;
    box-shadow: ${p => (p.$mobileOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none')};
  }
`;

const Overlay = styled.div`
  display: none;
  @media (max-width: 900px) {
    display: ${p => (p.$show ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 1199;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  margin-bottom: 16px;
  font-weight: 800;
  color: #00d2ff;
  font-size: 1rem;
`;

const Menu = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const MenuItem = styled.li`
  margin: 4px 0;
`;

const StyledLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #94a3b8;
  padding: 10px 12px;
  border-radius: 10px;
  transition: all 0.15s ease;
  white-space: nowrap;
  &.active {
    background: linear-gradient(90deg, rgba(0,210,255,0.12), rgba(58,123,213,0.08));
    color: #00d2ff;
    box-shadow: 0 4px 12px rgba(0,210,255,0.08);
  }
  &:hover:not(.active) {
    background: rgba(255,255,255,0.04);
    color: #e2e8f0;
  }
`;

const Label = styled.span`
  display: ${p => (p.$collapsed ? 'none' : 'inline')};
  font-weight: 600;
  font-size: 0.9rem;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255,255,255,0.06);
  margin: 10px 0;
`;

export default function Sidebar({ collapsed = false }) {
  const [isCollapsed, setCollapsed] = useState(collapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth <= 900) {
        setMobileOpen(s => !s);
      } else {
        setCollapsed(s => !s);
      }
    };
    window.addEventListener('toggleSidebar', handler);
    return () => window.removeEventListener('toggleSidebar', handler);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const navItems = [
    { to: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { to: '/booking', icon: <FaTicketAlt />, label: 'Booking' },
    { to: '/payment', icon: <FaCreditCard />, label: 'Payments' },
    { to: '/profile', icon: <FaUser />, label: 'Profile' },
  ];

  const adminItems = [
    { to: '/admin', icon: <FaUserShield />, label: 'Admin Panel' },
    { to: '/reports', icon: <FaChartLine />, label: 'Reports' },
  ];

  return (
    <>
      <Overlay $show={mobileOpen} onClick={closeMobile} />
      <SidebarContainer $collapsed={isCollapsed} $mobileOpen={mobileOpen} role="navigation" aria-label="Main sidebar">
        <Brand>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#00d2ff,#3a7bd5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#001219', fontWeight: 900, flexShrink: 0 }}>P</div>
          <span style={{ display: isCollapsed ? 'none' : 'block' }}>SUPRS</span>
          {mobileOpen && (
            <button onClick={closeMobile} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
              <FaTimes />
            </button>
          )}
        </Brand>

        <Menu>
          {navItems.map(item => (
            <MenuItem key={item.to}>
              <StyledLink to={item.to} onClick={closeMobile}>
                {item.icon}
                <Label $collapsed={isCollapsed}>{item.label}</Label>
              </StyledLink>
            </MenuItem>
          ))}

          {user?.role === 'ADMIN' && (
            <>
              <Divider />
              {adminItems.map(item => (
                <MenuItem key={item.to}>
                  <StyledLink to={item.to} onClick={closeMobile}>
                    {item.icon}
                    <Label $collapsed={isCollapsed}>{item.label}</Label>
                  </StyledLink>
                </MenuItem>
              ))}
            </>
          )}
        </Menu>
      </SidebarContainer>
    </>
  );
}