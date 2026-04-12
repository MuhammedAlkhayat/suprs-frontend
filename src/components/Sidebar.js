import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import {
  FaBars,
  FaTachometerAlt,
  FaTicketAlt,
  FaCreditCard,
  FaUserShield,
  FaChartLine,
  FaProjectDiagram,
  FaDatabase,
  FaUser,
  FaRegListAlt,
  FaTasks
} from 'react-icons/fa';

/* Use transient prop `$collapsed` so styled-components can read it
   but it will NOT be forwarded to the DOM as an attribute. */
const SidebarContainer = styled.nav`
  width: ${p => (p.$collapsed ? '64px' : '220px')};
  min-width: ${p => (p.$collapsed ? '64px' : '220px')};
  background: rgba(8,10,15,0.85);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  color: white;
  padding: 14px 8px;
  position: fixed;
  left: 0;
  top: var(--header-height, 70px);
  height: calc(100vh - var(--header-height, 70px));
  z-index: 1200;
  border-right: 1px solid rgba(255,255,255,0.04);
  transition: width 0.22s ease, left 0.22s ease;
  overflow-y: auto;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  margin-bottom: 12px;
  font-weight: 800;
  color: #00d2ff;
  font-size: 1rem;
`;

const Toggle = styled.button`
  background: transparent;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  width: 100%;
  display:flex;
  justify-content: ${p => (p.$collapsed ? 'center' : 'flex-end')};
  padding: 6px;
  margin-bottom: 6px;
`;

const Menu = styled.ul`
  list-style: none;
  padding: 6px;
  margin: 0;
`;

const MenuItem = styled.li`
  margin: 6px 0;
`;

const StyledLink = styled(NavLink)`
  display:flex;
  align-items:center;
  gap: 12px;
  text-decoration: none;
  color: #cbd5e1;
  padding: 10px;
  border-radius: 8px;
  transition: background 0.12s ease, color 0.12s ease;
  &.active {
    background: linear-gradient(90deg, rgba(0,210,255,0.08), rgba(58,123,213,0.06));
    color: #00d2ff;
    box-shadow: 0 6px 18px rgba(0,210,255,0.06);
  }
  &:hover {
    background: rgba(255,255,255,0.02);
    color: #ffffff;
  }
`;

const Label = styled.span`
  display: ${p => (p.$collapsed ? 'none' : 'inline')};
  font-weight: 700;
  font-size: 0.95rem;
`;

export default function Sidebar({ collapsed = false }) {
  // Keep accepting `collapsed` for API compatibility, but we only use it to init local state.
  const [isCollapsed, setCollapsed] = useState(collapsed);

  useEffect(() => {
    const className = 'sidebar-collapsed';
    if (isCollapsed) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }
    return () => {
      document.body.classList.remove(className);
    };
  }, [isCollapsed]);

  useEffect(() => {
    const handler = () => {
      setCollapsed(s => !s);
    };
    window.addEventListener('toggleSidebar', handler);
    return () => {
      window.removeEventListener('toggleSidebar', handler);
    };
  }, []);

  const toggle = () => setCollapsed(s => !s);

  return (
    <SidebarContainer
      /* pass transient prop so it is NOT forwarded to the DOM */
      $collapsed={isCollapsed}
      role="navigation"
      aria-label="Main sidebar"
      aria-expanded={!isCollapsed}
    >
      <Brand>
        <div
          style={{
            width: 36,
            height: 36,
            background: '#0ea5e9',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#001219',
            fontWeight: 900
          }}
          aria-hidden="true"
        >
          P
        </div>
        <div style={{ display: isCollapsed ? 'none' : 'block' }}>
          SUPRS
        </div>
      </Brand>

      <Toggle
        /* transient prop here too */
        $collapsed={isCollapsed}
        onClick={toggle}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={isCollapsed}
      >
        <FaBars />
      </Toggle>

      <Menu>
        <MenuItem>
          <StyledLink to="/dashboard" className={({isActive}) => (isActive ? 'active' : '')}>
            <FaTachometerAlt />
            <Label $collapsed={isCollapsed}>Map</Label>
          </StyledLink>
        </MenuItem>

        {/* ... other menu items -- ensure Label receives $collapsed ... */}

        <MenuItem>
          <StyledLink to="/booking" className={({isActive}) => (isActive ? 'active' : '')}>
            <FaTicketAlt />
            <Label $collapsed={isCollapsed}>Booking</Label>
          </StyledLink>
        </MenuItem>

        <MenuItem>
          <StyledLink to="/payment" className={({isActive}) => (isActive ? 'active' : '')}>
            <FaCreditCard />
            <Label $collapsed={isCollapsed}>Payment</Label>
          </StyledLink>
        </MenuItem>

        <MenuItem>
          <StyledLink to="/admin" className={({isActive}) => (isActive ? 'active' : '')}>
            <FaUserShield />
            <Label $collapsed={isCollapsed}>Admin</Label>
          </StyledLink>
        </MenuItem>

        <MenuItem>
          <StyledLink to="/reports" className={({isActive}) => (isActive ? 'active' : '')}>
            <FaChartLine />
            <Label $collapsed={isCollapsed}>Reports</Label>
          </StyledLink>
        </MenuItem>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.04)', margin: '12px 0' }} />

        <MenuItem>
          <StyledLink to="/diagrams/usecase" className={({isActive}) => (isActive ? 'active' : '')}>
            <FaRegListAlt />
            <Label $collapsed={isCollapsed}>Use Case</Label>
          </StyledLink>
        </MenuItem>

        <MenuItem>
          <StyledLink to="/diagrams/class" className={({isActive}) => (isActive ? 'active' : '')}>
            <FaProjectDiagram />
            <Label $collapsed={isCollapsed}>Class Diagram</Label>
          </StyledLink>
        </MenuItem>

        <MenuItem>
          <StyledLink to="/diagrams/activity" className={({isActive}) => (isActive ? 'active' : '')}>
            <FaTasks />
            <Label $collapsed={isCollapsed}>Activity Diagram</Label>
          </StyledLink>
        </MenuItem>

        <MenuItem>
          <StyledLink to="/diagrams/er" className={({isActive}) => (isActive ? 'active' : '')}>
            <FaDatabase />
            <Label $collapsed={isCollapsed}>ER Diagram</Label>
          </StyledLink>
        </MenuItem>

        <MenuItem>
          <StyledLink to="/profile" className={({isActive}) => (isActive ? 'active' : '')}>
            <FaUser />
            <Label $collapsed={isCollapsed}>Profile</Label>
          </StyledLink>
        </MenuItem>
      </Menu>
    </SidebarContainer>
  );
}