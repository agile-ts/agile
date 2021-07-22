import React from 'react';
import styled from 'styled-components';

const Card: React.FC = ({ children }) => (
  <Container onClick={(e) => e.stopPropagation()}>{children}</Container>
);

export default Card;

const Container = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: #ffffff;
  padding: 5px 10px 0 10px;
  align-items: flex-start;
  justify-content: flex-start;
  box-shadow: rgba(99, 99, 99, 0.2) 0 2px 8px 0;
  border-radius: 4px;
  z-index: 1000;
`;
