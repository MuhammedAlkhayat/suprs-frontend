import React from 'react';
import Sidebar from './Sidebar';
import styled from 'styled-components';

const Content = styled.main`
  margin-left: ${p => (p.$sidebarCollapsed ? '64px' : '220px')};
  padding: 28px;
  transition: margin-left 0.22s ease;
  min-height: 100vh;
  background: transparent;
`;

export default function ProtectedLayout({ children, sidebarCollapsed = false }) {
  // Sidebar still accepts the `collapsed` prop for API compatibility,
  // but the layout passes a transient prop ($sidebarCollapsed) to the styled <main>
  return (
    <>
      <Sidebar collapsed={sidebarCollapsed} />
      <Content $sidebarCollapsed={sidebarCollapsed}>
        {children}
      </Content>
    </>
  );
}