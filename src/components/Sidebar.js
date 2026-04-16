import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  FaTachometerAlt, FaParking, FaCreditCard, FaUser,
  FaChartBar, FaCog, FaSignOutAlt, FaTimes,
} from 'react-icons/fa';

const NAV = [
  { to:'/dashboard', icon:<FaTachometerAlt size={17}/>, label:'Dashboard' },
  { to:'/booking',   icon:<FaParking size={17}/>,       label:'Book a Slot' },
  { to:'/profile',   icon:<FaUser size={17}/>,          label:'My Profile' },
];

const ADMIN_NAV = [
  { to:'/admin',   icon:<FaCog size={17}/>,     label:'Admin Panel' },
  { to:'/reports', icon:<FaChartBar size={17}/>, label:'Reports' },
];

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const cls = [
    'suprs-sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <nav className={cls}>
      {/* Mobile close */}
      <button className="btn-icon" onClick={onClose}
        style={{ display:'none', marginBottom:8, alignSelf:'flex-end' }}
        id="sidebar-close-btn">
        <FaTimes size={14} />
      </button>

      {/* User mini card */}
      {!collapsed && (
        <div style={{ padding:'12px 10px 16px', marginBottom:8,
          borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:'50%',
              background:'linear-gradient(135deg,#00d2ff,#3a7bd5)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:800, color:'#001219', flexShrink:0 }}>
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.name || user?.email?.split('@')[0]}
              </div>
              <div style={{ fontSize:10, color:'var(--primary)', fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.5px' }}>
                {user?.role}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav section */}
      {!collapsed && (
        <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)',
          textTransform:'uppercase', letterSpacing:'1px', padding:'0 14px 6px' }}>
          Navigation
        </div>
      )}

      {NAV.map(item => (
        <NavLink key={item.to} to={item.to}
          className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
          title={collapsed ? item.label : undefined}>
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}

      {/* Admin section */}
      {user?.role === 'ADMIN' && (
        <>
          <div style={{ height:1, background:'var(--border)', margin:'12px 4px' }} />
          {!collapsed && (
            <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)',
              textTransform:'uppercase', letterSpacing:'1px', padding:'0 14px 6px' }}>
              Admin
            </div>
          )}
          {ADMIN_NAV.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </>
      )}

      {/* Spacer + logout */}
      <div style={{ flex:1 }} />
      <div style={{ height:1, background:'var(--border)', margin:'8px 4px 12px' }} />
      <button onClick={handleLogout}
        className="sidebar-nav-item"
        style={{ width:'100%', background:'none', border:'none', cursor:'pointer',
          color:'#fca5a5', borderColor:'transparent' }}
        title={collapsed ? 'Sign Out' : undefined}>
        <span className="nav-icon"><FaSignOutAlt size={17} /></span>
        <span className="nav-label">Sign Out</span>
      </button>

      <style>{`
        @media (max-width: 768px) {
          #sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}