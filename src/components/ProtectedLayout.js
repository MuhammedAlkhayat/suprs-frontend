import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: radial-gradient(circle at top right, #1e293b, #0f172a);
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  padding-top: var(--header-height, 70px);
`;

const Main = styled.main`
  flex: 1;
  margin-left: ${p => (p.$collapsed ? '64px' : '220px')};
  padding: 28px 24px;
  transition: margin-left 0.22s ease;
  min-height: calc(100vh - var(--header-height, 70px));
  @media (max-width: 900px) {
    margin-left: 0;
    padding: 16px;
  }
`;

export default function ProtectedLayout() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handler = () => setCollapsed(s => !s);
    window.addEventListener('toggleSidebar', handler);
    return () => window.removeEventListener('toggleSidebar', handler);
  }, []);

  return (
    <Wrapper>
      <Header />
      <Body>
        <Sidebar collapsed={collapsed} />
        <Main $collapsed={collapsed}>
          <Outlet />
        </Main>
      </Body>
      <Footer />
    </Wrapper>
  );
}