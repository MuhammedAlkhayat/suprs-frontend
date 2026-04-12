import React, { useEffect, useRef, useState } from 'react';
import Slider from 'react-slick';
import { Container, Button, Spinner } from 'react-bootstrap';
import styled from 'styled-components';
import { FaParking, FaCarSide } from 'react-icons/fa';
import { gsap } from 'gsap';
import api from '../services/api';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';

// --- Styled Components ---
const GlassCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2rem;
  margin-top: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  color: #f8fafc;
`;

/* Transient prop: use $status so it won't be forwarded to the DOM */
const SlotBox = styled.div`
  height: 180px;
  background-color: ${({ $status }) =>
    $status === 'AVAILABLE' ? 'rgba(34, 197, 94, 0.2)' :
    $status === 'OCCUPIED' ? 'rgba(239, 68, 68, 0.2)' :
    'rgba(234, 179, 8, 0.2)'};
  border: 2px solid ${({ $status }) =>
    $status === 'AVAILABLE' ? '#22c55e' :
    $status === 'OCCUPIED' ? '#ef4444' :
    '#eab308'};
  border-radius: 16px;
  display: flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: ${({ $status }) => ($status === 'AVAILABLE' ? 'pointer' : 'not-allowed')};
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: ${({ $status }) => ($status === 'AVAILABLE' ? 'translateY(-10px)' : 'none')};
    box-shadow: ${({ $status }) => ($status === 'AVAILABLE' ? '0 0 20px #00d2ff' : 'none')};
  }
  color: #f8fafc;
  font-weight: 700;
  font-size: 20px;
  text-align: center;
  user-select: none;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-left: auto;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  font-size: 2.5rem;
  color: #00d2ff;
`;

const IconWrapper = styled.div`
  font-size: 2.8rem;
`;

const Tooltip = styled.div`
  position: fixed;
  background: #0f172a;
  color: #00d2ff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.15s ease;
  z-index: 9999; /* very high so it's above overlays */
`;

// --- React Component ---
export default function Dashboard() {
  const history = useHistory();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const cardRef = useRef(null);

  // Fetch slots with React Query
  const { data: slots, isLoading, isError } = useQuery('slots', () =>
    api.get('/slots').then(res => res.data)
  );

  // GSAP animation on mount — use fromTo and cleanup to avoid leaving opacity at 0
  useEffect(() => {
    if (!cardRef.current) return;

    const anim = gsap.fromTo(
      cardRef.current,
      { y: 50, opacity: 0 }, // explicit start
      {
        duration: 1,
        y: 0,
        opacity: 1,
        ease: 'power4.out',
        onComplete() {
          // remove inline opacity to let CSS be authoritative afterwards
          try { if (cardRef.current) cardRef.current.style.opacity = ''; } catch (e) {}
        }
      }
    );

    return () => {
      // kill animation and ensure element is visible when unmounting/navigating away
      try {
        if (anim) anim.kill();
        if (cardRef.current) cardRef.current.style.opacity = '1';
      } catch (e) {}
    };
  }, []);

  // react-slick settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: '40px',
    responsive: [
      { breakpoint: 992, settings: { slidesToShow: 2 } },
      { breakpoint: 576, settings: { slidesToShow: 1 } },
    ],
  };

  const handleSlotClick = (slot) => {
    // guard — only navigate if available
    if (slot.status === 'AVAILABLE') {
      history.push({ pathname: '/booking', state: { selectedSlot: slot } });
    }
  };

  const showTooltip = (e, slot) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 40,
      text: `${slot.code} - ${slot.status} - $${slot.price_per_hour}/hr`,
    });
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, x: 0, y: 0, text: '' });
  };

  if (isLoading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (isError) return <Container className="text-center mt-5 text-danger">Failed to load slots.</Container>;

  return (
    <Container ref={cardRef} className="d-flex flex-column min-vh-100 py-4">
      <div className="d-flex align-items-center mb-4">
        <Title>
          <IconWrapper>🅿️</IconWrapper> SUPRS Smart Map
        </Title>
        <HeaderButtons>
          <Button variant="secondary" onClick={() => history.push('/admin')}>Admin Panel</Button>
          <Button variant="danger" onClick={() => { localStorage.clear(); history.push('/login'); }}>Logout</Button>
        </HeaderButtons>
      </div>

      <GlassCard>
        <h4>Entrance</h4>
        <Slider {...settings}>
          {slots.map(slot => (
            // wrap each slide with a div as expected by react-slick
            <div key={slot.slot_id}>
              <SlotBox
                $status={slot.status}                 // transient prop — won't be forwarded to DOM
                onClick={() => handleSlotClick(slot)} // handler already guards
                onMouseEnter={(e) => showTooltip(e, slot)}
                onMouseLeave={hideTooltip}
                role={slot.status === 'AVAILABLE' ? 'button' : undefined}
                aria-disabled={slot.status === 'AVAILABLE' ? 'false' : 'true'}
              >
                {slot.status === 'AVAILABLE' && <FaParking size={48} color="#22c55e" />}
                {slot.status === 'OCCUPIED' && <FaCarSide size={48} color="#ef4444" />}
                {slot.status === 'RESERVED' && <FaParking size={48} color="#eab308" />}
                <div style={{ marginTop: '10px' }}>{slot.code}</div>
                <div>{slot.status}</div>
                <small>${slot.price_per_hour}/hr</small>
              </SlotBox>
            </div>
          ))}
        </Slider>
      </GlassCard>

      {tooltip.visible && (
        <Tooltip style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}>
          {tooltip.text}
        </Tooltip>
      )}
    </Container>
  );
}