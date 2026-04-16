import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { gsap } from 'gsap';
import { FaClock, FaTicketAlt, FaArrowRight } from 'react-icons/fa';

const BookingCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2.5rem;
  margin-top: 3rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
`;

const PriceTag = styled.div`
  font-size: 3rem;
  font-weight: 800;
  color: #00d2ff;
  text-shadow: 0 0 15px rgba(0, 210, 255, 0.5);
`;

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [hours, setHours] = useState(1);

  // ✅ use slot_number, default price 5 since price_per_hour removed from schema
  const slot = location.state?.selectedSlot || { slot_number: 'N/A', id: null };
  const pricePerHour = 5; // fixed rate — update when you add price column

  useEffect(() => {
    if (!cardRef.current) return;
    const anim = gsap.fromTo(
      cardRef.current,
      { x: -100, opacity: 0 },
      {
        duration: 1, x: 0, opacity: 1, ease: 'power3.out',
        onComplete() {
          try { if (cardRef.current) cardRef.current.style.opacity = ''; } catch (e) {}
        }
      }
    );
    return () => {
      try {
        if (anim) anim.kill();
        if (cardRef.current) cardRef.current.style.opacity = '1';
      } catch (e) {}
    };
  }, []);

  const handleConfirm = () => {
    const total = hours * pricePerHour;
    // ✅ pass slot_number and slot id
    navigate('/payment', { state: { total, slotCode: slot.slot_number, slotId: slot.id } });
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <BookingCard ref={cardRef}>
            <div className="text-center mb-4">
              <FaTicketAlt size={40} color="#00d2ff" className="mb-3" />
              <h2 className="fw-bold">Confirm Reservation</h2>
              {/* ✅ slot_number */}
              <p className="text-muted">Slot: <span className="text-white fw-bold">{slot.slot_number}</span></p>
            </div>

            <div className="mb-4">
              <label className="text-muted mb-2"><FaClock className="me-2" />Select Duration (Hours)</label>
              <Form.Range
                min="1" max="24"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
              <div className="d-flex justify-content-between mt-2 fw-bold">
                <span>1 hr</span>
                <span style={{ color: '#00d2ff' }}>{hours} Hours</span>
                <span>24 hrs</span>
              </div>
            </div>

            <div className="text-center my-5">
              <small className="text-muted d-block mb-1">Total Estimated Price</small>
              <PriceTag>${(hours * pricePerHour).toFixed(2)}</PriceTag>
            </div>

            <Button
              variant="primary" className="w-100 py-3 fw-bold"
              style={{ borderRadius: '12px', fontSize: '1.1rem' }}
              onClick={handleConfirm}
            >
              PROCEED TO PAYMENT <FaArrowRight className="ms-2" />
            </Button>

            <Button
              variant="link" className="w-100 mt-3 text-muted text-decoration-none"
              onClick={() => navigate('/dashboard')}
            >
              Cancel and go back
            </Button>
          </BookingCard>
        </Col>
      </Row>
    </Container>
  );
}