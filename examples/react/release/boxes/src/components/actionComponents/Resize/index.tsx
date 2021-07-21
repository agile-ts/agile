import React from 'react';
import { Resizable, ResizeHandle as ResizeHandleType } from 'react-resizable';
import Handle from './components/Handle';
import { ElementStyleInterface } from '../../../core/entities/ui/ui.interfaces';

const handlePlacements: ResizeHandleType[] = [
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
  // https://github.com/react-grid-layout/react-resizable#functional-components
  const WrappedHandle = React.forwardRef((props: any, ref) => (
    <Handle innerRef={ref} {...props} />
  ));

  return (
    <Resizable
      width={size.width}
      height={size.height}
      onResize={(_, { size: newSize, handle }) => {
        console.log('onResize', size);

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
      // The handle (dot) to resize the Component
      handle={<WrappedHandle visible={selected} />}
      lockAspectRatio={lockAspectRatio}>
      <div>{children}</div>
    </Resizable>
  );
};
