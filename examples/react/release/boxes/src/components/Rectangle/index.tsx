import React from 'react';
import { Drag } from '../actionComponents/Drag';
import { Resize } from '../actionComponents/Resize';
import { RectangleContainer } from './components/RectangleContainer';
import { RectangleInner } from './components/RectangleInner';
import { useAgile } from '@agile-ts/react';
import core from '../../core';
import { ElementStyleInterface } from '../../core/entities/ui/ui.interfaces';
import { useSelector } from '@agile-ts/react/dist/hooks/useSelector';

export interface RectangleProps {
  id: string | number;
}

export const Rectangle: React.FC<RectangleProps> = (props) => {
  const { id } = props;

  const ELEMENT = core.ui.ELEMENTS.getItem(id);
  const element = useAgile(ELEMENT, { componentId: 'Rectangle' });
  const selectedElementId = useSelector(
    core.ui.SELECTED_ELEMENT,
    (value) => value?.id,
    {
      componentId: 'Rectangle',
    }
  ) as string | number;
  const selected = selectedElementId === element?.id;

  // Check if Element exists
  if (element == null || ELEMENT == null) return null;

  return (
    <RectangleContainer
      position={element.style.position}
      size={element.style.size}
      onSelect={() => {
        core.ui.selectElement(id);
      }}>
      <Resize
        selected={selected}
        position={element.style.position}
        size={element.style.size}
        onResize={(style: ElementStyleInterface) => {
          console.log('onResize', style); // TODO REMOVE
          ELEMENT?.patch({ style: style });
        }}
        lockAspectRatio={element.image !== undefined}>
        <Drag
          position={element.style.position}
          onDrag={(position) => {
            ELEMENT.nextStateValue.style.position = position;
            ELEMENT.ingest();
          }}>
          <RectangleInner id={id} selected={selected} />
        </Drag>
      </Resize>
    </RectangleContainer>
  );
};
