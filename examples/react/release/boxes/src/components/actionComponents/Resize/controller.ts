import { ResizeHandle as ResizeHandleType } from 'react-resizable';
import { ElementStyleInterface } from '../../../core/entities/ui/ui.interfaces';

export const handlePlacements: ResizeHandleType[] = [
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
];

export const calculateResize = (
  size: ElementStyleInterface['size'],
  newSize: ElementStyleInterface['size'],
  position: ElementStyleInterface['position'],
  handle: string
): ElementStyleInterface => {
  let topDiff = 0;
  if (handle.includes('n')) {
    topDiff = size.height - newSize.height;
  }

  let leftDiff = 0;
  if (handle.includes('w')) {
    leftDiff = size.width - newSize.width;
  }

  return {
    size: {
      width: Math.round(newSize.width),
      height: Math.round(newSize.height),
    },
    position: {
      top: Math.round(position.top + topDiff),
      left: Math.round(position.left + leftDiff),
    },
  };
};
