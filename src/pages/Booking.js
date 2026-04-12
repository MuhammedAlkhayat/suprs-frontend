import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
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
  const history = useHistory();
  const cardRef = useRef(null);
  const [hours, setHours] = useState(1);

  const slot = location.state?.selectedSlot || { code: 'N/A', price_per_hour: 0 };

  useEffect(() => {
    if (!cardRef.current) return;

    // explicit from -> to animation so we don't rely on implicit starting state
    const anim = gsap.fromTo(
      cardRef.current,
      { x: -100, opacity: 0 },          // from
      {
        duration: 1,
        x: 0,
        opacity: 1,
        ease: 'power3.out',
        onComplete() {
          // remove inline opacity so CSS is authoritative afterwards
          try { if (cardRef.current) cardRef.current.style.opacity = ''; } catch (e) {}
        }
      }
    );

    // cleanup on unmount: kill animation and ensure opacity restored
    return () => {
      try {
        if (anim) anim.kill();
        if (cardRef.current) cardRef.current.style.opacity = '1';
      } catch (e) {}
    };
  }, []);

  const handleConfirm = () => {
    const total = hours * slot.price_per_hour;
    history.push({
      pathname: '/payment',
      state: { total, slotCode: slot.code }
    });
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <BookingCard ref={cardRef}>
            <div className="text-center mb-4">
              <FaTicketAlt size={40} color="#00d2ff" className="mb-3" />
              <h2 className="fw-bold">Confirm Reservation</h2>
              <p className="text-muted">Slot: <span className="text-white fw-bold">{slot.code}</span></p>
            </div>

            <div className="mb-4">
              <label className="text-muted mb-2"><FaClock className="me-2" /> Select Duration (Hours)</label>
              <Form.Range
                min="1"
                max="24"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
              <div className="d-flex justify-content-between mt-2 fw-bold">
                <span>1 hr</span>
                <span style={{color: '#00d2ff'}}>{hours} Hours</span>
                <span>24 hrs</span>
              </div>
            </div>

            <div className="text-center my-5">
              <small className="text-muted d-block mb-1">Total Estimated Price</small>
              <PriceTag>${(hours * slot.price_per_hour).toFixed(2)}</PriceTag>
            </div>

            <Button
              variant="primary"
              className="w-100 py-3 fw-bold"
              style={{borderRadius: '12px', fontSize: '1.1rem'}}
              onClick={handleConfirm}
            >
              PROCEED TO PAYMENT <FaArrowRight className="ms-2" />
            </Button>

            <Button
              variant="link"
              className="w-100 mt-3 text-muted text-decoration-none"
              onClick={() => history.push('/dashboard')}
            >
              Cancel and go back
            </Button>
          </BookingCard>
        </Col>
      </Row>
    </Container>
  );
}