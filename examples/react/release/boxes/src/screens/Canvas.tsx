import React, { useEffect } from 'react';
import { EditProperties } from '../components/EditProperties';
import PageContainer from '../components/PageContainer';
import Toolbar from '../components/Toolbar';
import { useValue } from '@agile-ts/react';
import { Rectangle } from '../components/Rectangle';
import core from '../core';
import { useWindowSize } from '../hooks/useWindowSize';

const Canvas = () => {
  const elementIds = useValue(core.ui.ELEMENTS.getDefaultGroup(), {
    componentId: 'Canvas',
  });
  const { windowHeight, windowWidth } = useWindowSize();

  useEffect(() => {
    if (windowWidth != null && windowHeight != null) {
      core.ui.defaultElementStyle.position = {
        left: Math.floor(
          windowWidth / 2 - core.ui.defaultElementStyle.size.width / 2
        ),
        top: Math.floor(
          windowHeight / 2 - core.ui.defaultElementStyle.size.height / 2
        ),
      };
    }
  }, [windowWidth, windowHeight]);

  if (elementIds == null) return null;

  return (
    <PageContainer
      onClick={() => {
        core.ui.unselectSelectedElement();
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
