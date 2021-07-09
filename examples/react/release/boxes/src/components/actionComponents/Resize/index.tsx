import React from 'react';
import { Resizable, ResizeHandle } from 'react-resizable';
import { Handle, HandlePropsInterface } from './components/Handle';
import { ElementStyleInterface } from '../../../core/entities/ui/ui.interfaces';

const handlePlacements: ResizeHandle[] = [
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
];

interface ResizePropsInterface extends ElementStyleInterface {
  selected: boolean;
  onResize: (style: ElementStyleInterface) => void;
  lockAspectRatio: boolean;
}

export const Resize: React.FC<ResizePropsInterface> = (props) => {
  const {
    selected,
    children,
    position,
    size,
    onResize,
    lockAspectRatio,
  } = props;

  // https://github.com/react-grid-layout/react-resizable#custom-react-component
  const WrappedHandle = React.forwardRef((props: HandlePropsInterface, ref) => (
    <Handle innerRef={ref} {...props} />
  ));

  return (
    <Resizable
      width={size.width}
      height={size.height}
      onResize={(_, { size: newSize, handle }) => {
        console.debug('onResize', size);

        let topDiff = 0;
        if (handle.includes('n')) {
          topDiff = size.height - newSize.height;
        }

        let leftDiff = 0;
        if (handle.includes('w')) {
          leftDiff = size.width - newSize.width;
        }

        onResize({
          size: {
            width: Math.round(newSize.width),
            height: Math.round(newSize.height),
          },
          position: {
            top: position.top + topDiff,
            left: position.left + leftDiff,
          },
        });
      }}
      resizeHandles={handlePlacements}
      handle={(placement) => (
        <WrappedHandle placement={placement} visible={selected} />
      )}
      lockAspectRatio={lockAspectRatio}>
      <div>{children}</div>
    </Resizable>
  );
};
