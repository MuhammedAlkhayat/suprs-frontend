import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Container, Row, Col, Table, Spinner } from 'react-bootstrap';
import { gsap } from 'gsap';
import { FaChartLine, FaWallet, FaCar, FaArrowUp } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query'; // ✅ v5
import api from '../services/api';

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
  width: 50px; height: 50px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 210, 255, 0.1);
  color: #00d2ff;
  margin-bottom: 1rem;
`;

export default function Reports() {
  const containerRef = useRef(null);

  // ✅ Real data from backend
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => api.get('/bookings').then(res => res.data),
  });

  const { data: slots = [] } = useQuery({
    queryKey: ['slots'],
    queryFn: () => api.get('/slots').then(res => res.data),
  });

  // Compute real stats
  const totalBookings = bookings.length;
  const occupiedSlots = slots.filter(s => s.status === 'OCCUPIED').length;
  const totalSlots = slots.length || 1;
  const occupancyRate = Math.round((occupiedSlots / totalSlots) * 100);

  useEffect(() => {
    if (!containerRef.current) return;
    const nodes = Array.from(containerRef.current.querySelectorAll('.report-item'));
    if (nodes.length === 0) return;

    const anim = gsap.fromTo(
      nodes,
      { y: 30, opacity: 0 },
      {
        duration: 0.8, y: 0, opacity: 1, stagger: 0.2, ease: 'power2.out',
        onComplete() {
          nodes.forEach(n => { try { n.style.opacity = ''; } catch (e) {} });
        }
      }
    );

    return () => {
      try {
        if (anim) anim.kill();
        nodes.forEach(n => { try { n.style.opacity = '1'; } catch (e) {} });
      } catch (e) {}
    };
  }, [bookings]); // re-run when data loads

  if (loadingBookings) return (
    <Container className="text-center mt-5">
      <Spinner animation="border" style={{ color: '#00d2ff' }} />
    </Container>
  );

  return (
    <Container ref={containerRef} className="py-5">
      <h2 className="fw-bold mb-4" style={{ color: '#00d2ff' }}>📊 System Analytics & Reports</h2>

      <Row>
        <Col md={4} className="report-item">
          <StatsCard>
            <IconBox><FaWallet size={24} /></IconBox>
            <small className="text-muted">Total Bookings</small>
            <h3 className="fw-bold">{totalBookings}</h3>
          </StatsCard>
        </Col>
        <Col md={4} className="report-item">
          <StatsCard>
            <IconBox><FaCar size={24} /></IconBox>
            <small className="text-muted">Occupied Slots</small>
            <h3 className="fw-bold">{occupiedSlots} / {totalSlots}</h3>
          </StatsCard>
        </Col>
        <Col md={4} className="report-item">
          <StatsCard>
            <IconBox><FaChartLine size={24} /></IconBox>
            <small className="text-muted">Occupancy Rate</small>
            <h3 className="fw-bold">{occupancyRate}%</h3>
          </StatsCard>
        </Col>
      </Row>

      <div className="glass-card mt-4 report-item">
        <h5 className="mb-4">Recent Bookings</h5>
        <Table responsive variant="dark" className="bg-transparent">
          <thead>
            <tr>
              <th>#</th>
              <th>Slot ID</th>
              <th>User ID</th>
              <th>Booked At</th>
              <th>Payment</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted">No bookings yet</td></tr>
            ) : (
              bookings.slice(0, 10).map(b => (
                <tr key={b.booking_id}>
                  <td>{b.booking_id}</td>
                  <td>{b.slot_id}</td>
                  <td>{b.user_id}</td>
                  <td>{new Date(b.booked_at).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${b.payment_status === 'PAID' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {b.payment_status}
                    </span>
                  </td>
                  <td>{b.payment_method}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </Container>
  );
}