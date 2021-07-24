import React from 'react';
import styled from 'styled-components';
import BounceSpinner from '../../BounceSpinner';

export interface RectangleLoadingProps {
  borderRadius: string;
}

const RectangleLoading: React.FC<RectangleLoadingProps> = (props) => {
  const { borderRadius } = props;

  return (
    <Container borderRadius={borderRadius}>
      <BounceSpinner />
    </Container>
  );
};

export default RectangleLoading;

const Container = styled.div<{ borderRadius: string }>`
  display: flex;
  flex: 1;
  border: 3px dashed #101010;
  border-radius: ${(props) => props.borderRadius};
  align-items: center;
  justify-content: center;
  background: #ffffff;
`;
