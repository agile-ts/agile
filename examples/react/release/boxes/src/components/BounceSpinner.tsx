import React from 'react';
import styled from 'styled-components';

// https://tobiasahlin.com/spinkit/
const BounceSpinner: React.FC = () => {
  return (
    <Container>
      <DoubleBounce1 />
      <DoubleBounce2 />
    </Container>
  );
};

export default BounceSpinner;

const Container = styled.div`
  width: 40px;
  height: 40px;
  position: relative;
  margin: 100px auto;
`;

const DoubleBounce = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #ccca;
  opacity: 0.6;
  position: absolute;
  top: 0;
  left: 0;

  @-webkit-keyframes sk-bounce {
    0%,
    100% {
      -webkit-transform: scale(0);
    }
    50% {
      -webkit-transform: scale(1);
    }
  }

  @keyframes sk-bounce {
    0%,
    100% {
      transform: scale(0);
      -webkit-transform: scale(0);
    }
    50% {
      transform: scale(1);
      -webkit-transform: scale(1);
    }
  }

  -webkit-animation: sk-bounce 2s infinite ease-in-out;
  animation: sk-bounce 2s infinite ease-in-out;
`;

const DoubleBounce1 = styled(DoubleBounce)``;
const DoubleBounce2 = styled(DoubleBounce)`
  -webkit-animation-delay: -1s;
  animation-delay: -1s;
`;
