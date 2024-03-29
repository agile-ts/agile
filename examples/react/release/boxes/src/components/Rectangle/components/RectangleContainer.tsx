import React from 'react';
import { ElementStyleInterface } from '../../../core/entities/ui/ui.interfaces';
import styled from 'styled-components';

type RectangleContainerProps = {
  position: ElementStyleInterface['position'];
  size: ElementStyleInterface['size'];
  onSelect: () => void;
};

const RectangleContainer: React.FC<RectangleContainerProps> = (props) => {
  const { children, size, position, onSelect } = props;

  return (
    <Container
      style={{ ...size, ...position }}
      onMouseDown={() => onSelect()}
      onClick={(e) => e.stopPropagation()}>
      {children}
    </Container>
  );
};

export default RectangleContainer;

const Container = styled.div`
  position: absolute;
`;
