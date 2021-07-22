import React from 'react';
import { ResizeHandle } from 'react-resizable';
import core from '../../../../core';
import styled from 'styled-components';

type Position = {
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
};

export interface HandlePropsInterface {
  handleAxis: ResizeHandle;
  visible: boolean;
  innerRef?: any;
}

const Handle: React.FC<HandlePropsInterface> = (props) => {
  const { handleAxis, visible, innerRef } = props;

  const size = 10;
  const position: Position = {};
  let cursor = 'default';

  // Calculate handle position
  if (handleAxis.startsWith('n')) position.top = 0;
  if (handleAxis.startsWith('s')) position.bottom = -8;
  if (handleAxis.includes('w')) position.left = 0;
  if (handleAxis.includes('e')) position.right = -8;

  if (handleAxis === 'n' || handleAxis === 's') position.left = '50%';
  if (handleAxis === 'e' || handleAxis === 'w') position.top = '50%';

  cursor = `${handleAxis}-resize`;
  if (handleAxis === 'n' || handleAxis === 's') cursor = 'ns-resize';

  return (
    <Container
      className={`handle-${handleAxis}`}
      ref={innerRef}
      style={{
        ...position,
        width: size - 2,
        height: size - 2,
        margin: -size / 2,
        cursor,
      }}
      color={core.ui.getBorderColor(visible)}
    />
  );
};

export default Handle;

const Container = styled.div<{ color: string }>`
  position: absolute;
  background-color: ${(props) => props.color};
  transition: 0.1s background-color ease-in-out;
`;
