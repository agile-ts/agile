import React from 'react';
import { DraggableCore } from 'react-draggable';
import { ElementStyleInterface } from '../../core/entities/ui/ui.interfaces';

type DragProps = {
  position: ElementStyleInterface['position'];
  onDrag: (position: ElementStyleInterface['position']) => void;
};

export const Drag: React.FC<DragProps> = (props) => {
  const { position, onDrag, children } = props;

  return (
    <DraggableCore
      onDrag={(e: any) => {
        onDrag({
          left: e.movementX + position.left,
          top: e.movementY + position.top,
        });
      }}>
      {children}
    </DraggableCore>
  );
};
