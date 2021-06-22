import React from 'react';
import { Drag } from '../actionComponents/Drag';
import { Resize } from '../actionComponents/Resize';
import { RectangleContainer } from './components/RectangleContainer';
import { RectangleInner } from './components/RectangleInner';
import { useAgile, useProxy } from '@agile-ts/react';
import core from '../../core';
import { SELECTED_ELEMENT } from '../../core/entities/ui/ui.controller';
import { ElementStyleInterface } from '../../core/entities/ui/ui.interfaces';

export interface RectanglePropsInterface {
  id: string | number;
}

export const Rectangle: React.FC<RectanglePropsInterface> = (props) => {
  const { id } = props;

  const ELEMENT = core.ui.ELEMENTS.getItem(id);
  const element = useAgile(ELEMENT, { componentId: 'Rectangle' });
  const selectedElement = useProxy(core.ui.SELECTED_ELEMENT, {
    componentId: 'Rectangle',
  });

  if (element == null) return null;

  const selected = selectedElement?.id === element.id;

  return (
    <RectangleContainer
      position={element.style.position}
      size={element.style.size}
      onSelect={() => {
        if (SELECTED_ELEMENT.itemKey !== id) SELECTED_ELEMENT.select(id);
      }}>
      <Resize
        selected={selected}
        position={element.style.position}
        size={element.style.size}
        onResize={(style: ElementStyleInterface) => {
          console.log('onResize', style);
          ELEMENT?.patch({ style: style });
        }}
        lockAspectRatio={element.image !== undefined}>
        <Drag
          position={element.style.position}
          onDrag={(position) => {
            ELEMENT?.patch({
              style: {
                ...ELEMENT?.value.style,
                position,
              },
            });
          }}>
          <div>
            <RectangleInner selected={selected} id={id} />
          </div>
        </Drag>
      </Resize>
    </RectangleContainer>
  );
};
