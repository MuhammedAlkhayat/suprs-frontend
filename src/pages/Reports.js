import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Container, Row, Col, Card, Table } from 'react-bootstrap';
import { gsap } from 'gsap';
import { FaChartLine, FaWallet, FaCar, FaArrowUp } from 'react-icons/fa';

const StatsCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: transform 0.3s ease;
  &:hover { transform: translateY(-5px); }
`;

const IconBox = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 210, 255, 0.1);
  color: #00d2ff;
  margin-bottom: 1rem;
`;

export default function Reports() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const nodes = Array.from(containerRef.current.querySelectorAll('.report-item'));
    if (nodes.length === 0) return;

    // explicit from->to animation to avoid implicit start states
    const anim = gsap.fromTo(
      nodes,
      { y: 30, opacity: 0 },
      {
        duration: 0.8,
        y: 0,
        opacity: 1,
        stagger: 0.2,
        ease: 'power2.out',
        onComplete() {
          // clear inline opacity so CSS remains authoritative
          nodes.forEach(n => { try { n.style.opacity = ''; } catch (e) {} });
        }
      }
    );

    return () => {
      // cleanup: kill animation and ensure nodes are visible
      try {
        if (anim) anim.kill();
        nodes.forEach(n => { try { n.style.opacity = '1'; } catch (e) {} });
      } catch (e) {}
    };
  }, []);

  return (
    <Container ref={containerRef} className="py-5">
      <h2 className="fw-bold mb-4" style={{ color: '#00d2ff' }}>📊 System Analytics & Reports</h2>
      
      <Row>
        <Col md={4} className="report-item">
          <StatsCard>
            <IconBox><FaWallet size={24} /></IconBox>
            <small className="text-muted">Total Revenue (Weekly)</small>
            <h3 className="fw-bold">$1,240.50 <small className="text-success" style={{fontSize: '0.8rem'}}><FaArrowUp /> 12%</small></h3>
          </StatsCard>
        </Col>
        <Col md={4} className="report-item">
          <StatsCard>
            <IconBox><FaCar size={24} /></IconBox>
            <small className="text-muted">Total Bookings</small>
            <h3 className="fw-bold">482</h3>
          </StatsCard>
        </Col>
        <Col md={4} className="report-item">
          <StatsCard>
            <IconBox><FaChartLine size={24} /></IconBox>
            <small className="text-muted">Occupancy Rate</small>
            <h3 className="fw-bold">78%</h3>
          </StatsCard>
        </Col>
      </Row>

      <div className="glass-card mt-4 report-item">
        <h5 className="mb-4">Recent Transactions</h5>
        <Table responsive variant="dark" className="bg-transparent">
          <thead>
            <tr>
              <th>Date</th>
              <th>Slot</th>
              <th>Duration</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2026-03-27</td>
              <td>A1</td>
              <td>3 hrs</td>
              <td>$15.00</td>
              <td><span className="badge bg-success">Paid</span></td>
            </tr>
            <tr>
              <td>2026-03-27</td>
              <td>B2</td>
              <td>1 hr</td>
              <td>$8.00</td>
              <td><span className="badge bg-success">Paid</span></td>
            </tr>
          </tbody>
        </Table>
      </div>
    </Container>
  );
}