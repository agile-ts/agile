import React from 'react';
import { EditProperties } from '../components/EditProperties';
import { PageContainer } from '../components/PageContainer';
import { Toolbar } from '../components/Toolbar';
import { useValue } from '@agile-ts/react';
import { Rectangle } from '../components/Rectangle';
import core from '../core';

const Canvas = () => {
  const elementIds = useValue(
    core.ui.ELEMENTS.getGroupWithReference('default'),
    { componentId: 'Canvas' }
  );

  return (
    <PageContainer
      onClick={() => {
        core.ui.SELECTED_ELEMENT.unselect();
      }}>
      <Toolbar />
      <EditProperties />
      {elementIds.map((id) => (
        <Rectangle key={id} id={id} />
      ))}
    </PageContainer>
  );
};

export default Canvas;