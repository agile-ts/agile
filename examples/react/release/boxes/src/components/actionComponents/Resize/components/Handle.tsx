import React from 'react';
import { Box } from '@chakra-ui/react';
import { ResizeHandle } from 'react-resizable';
import core from '../../../../core';

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
  if (handleAxis.startsWith('s')) position.bottom = 0;
  if (handleAxis.includes('w')) position.left = 0;
  if (handleAxis.includes('e')) position.right = 0;

  if (handleAxis === 'n' || handleAxis === 's') position.left = '50%';
  if (handleAxis === 'e' || handleAxis === 'w') position.top = '50%';

  cursor = `${handleAxis}-resize`;
  if (handleAxis === 'n' || handleAxis === 's') cursor = 'ns-resize';

  return (
    <Box
      className={`handle-${handleAxis}`}
      ref={innerRef}
      position="absolute"
      style={{
        ...position,
        width: size - 2,
        height: size - 2,
        margin: -size / 2,
        cursor,
      }}
      border={`1px solid ${core.ui.getBorderColor(visible)}`}
      transition="0.1s border-color ease-in-out"
      backgroundColor="white"
    />
  );
};

export default Handle;
