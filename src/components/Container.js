import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* Use a solid background first to test */
  background: #0f172a; 
  /* Then add the gradient back once it works */
  background: radial-gradient(circle at top right, #1e293b, #0f172a);
  color: white;
  position: relative;
  z-index: 1;
`;

export default Container;s
