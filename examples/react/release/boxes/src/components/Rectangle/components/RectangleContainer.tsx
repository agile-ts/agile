import React from 'react';
import { Box } from '@chakra-ui/react';
import { ElementStyleInterface } from '../../../core/entities/ui/ui.interfaces';

type RectangleContainerProps = {
  position: ElementStyleInterface['position'];
  size: ElementStyleInterface['size'];
  onSelect: () => void;
};

export const RectangleContainer: React.FC<RectangleContainerProps> = ({
  children,
  size,
  position,
  onSelect,
}) => {
  return (
    <Box
      position="absolute"
      style={{ ...size, ...position }}
      onMouseDown={() => onSelect()}
      onClick={(e) => e.stopPropagation()}>
      {children}
    </Box>
  );
};
