import React from 'react';
import { Resizable, ResizeHandle as ResizeHandleType } from 'react-resizable';
import Handle from './components/Handle';
import { ElementStyleInterface } from '../../../core/entities/ui/ui.interfaces';
import { calculateResize, handlePlacements } from './controller';

interface ResizePropsInterface extends ElementStyleInterface {
  selected: boolean;
  onResize: (updatedData: ElementStyleInterface) => void;
  lockAspectRatio: boolean;
}

const Resize: React.FC<ResizePropsInterface> = (props) => {
  const {
    selected,
    children,
    position,
    size,
    onResize,
    lockAspectRatio,
  } = props;

  return (
    <Resizable
      width={size.width}
      height={size.height}
      onResize={(_, { size: newSize, handle }) => {
        onResize(calculateResize(size, newSize, position, handle));
      }}
      resizeHandles={handlePlacements}
      // The handle (dot) to resize the Component
      // TODO Make this work in the latest 'react-resizeable' version.. (-> upgrade from 1.x to 3.x)
      // handle={(handleAxis: ResizeHandleType, ref: any) => (
      //   <Handle handleAxis={handleAxis} innerRef={ref} visible={selected} />
      // )}
      handle={(handleAxis: ResizeHandleType) => (
        <div>
          <Handle handleAxis={handleAxis} visible={selected} />
        </div>
      )}
      lockAspectRatio={lockAspectRatio}>
      <div>{children}</div>
    </Resizable>
  );
};

export default Resize;
