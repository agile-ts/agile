import React from 'react';
import styled from 'styled-components';

const Info = ({ label, value }: { label: string; value?: string }) => {
  return (
    <Container>
      <Title>{label}</Title>
      {value == null ? <Skeleton /> : <Description>{value}</Description>}
    </Container>
  );
};

export default Info;

const Container = styled.div`
  max-width: 175px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const Description = styled.div`
  font-size: 14px;
`;

const Skeleton = styled.div`
  width: 100%;
  height: 21px;
  border-radius: 4px;
  background: linear-gradient(
      70deg,
      #ccca 30%,
      rgba(224, 223, 223, 0.67),
      #ccca 60%
    )
    right/300% 100%;
  animation: loading 1s linear infinite;

  @keyframes loading {
    to {
      background-position: left;
    }
  }
`;
