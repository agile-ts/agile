import React from 'react';
import styled from 'styled-components';
import { useAgile } from '@agile-ts/react';
import core from '../../../core';

interface PageContainerProps {
  onClick: () => void;
}

const CanvasContainer: React.FC<PageContainerProps> = (props) => {
  const { onClick, children } = props;
  const canvas = useAgile(core.ui.CANVAS);

  return (
    <Container width={canvas.width} height={canvas.height} onClick={onClick}>
      {children}
    </Container>
  );
};

export default CanvasContainer;

const Container = styled.div<{ width: number; height: number }>`
  display: flex;
  flex: 1;
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  background-color: #8a8a8e;
`;
