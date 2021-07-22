import React, { useEffect } from 'react';
import EditProperties from './components/EditProperties';
import CanvasContainer from './components/CanvasContainer';
import Toolbar from './components/Toolbar';
import { useValue } from '@agile-ts/react';
import Rectangle from '../../components/Rectangle';
import core from '../../core';
import { useWindowSize } from '../../hooks/useWindowSize';

const Canvas = () => {
  const elementIds = useValue(core.ui.ELEMENTS.getDefaultGroup(), {
    componentId: 'Canvas',
  });
  const { windowHeight, windowWidth } = useWindowSize();

  useEffect(() => {
    core.ui.assignDefaultElementStyle(windowWidth, windowHeight);
  }, [windowWidth, windowHeight]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const DELETE_KEY = 46;
      if (event.keyCode === DELETE_KEY) core.ui.deleteSelectedElement();
    };
    document.addEventListener('keydown', handler);

    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, []);

  if (elementIds == null) return null;

  return (
    <CanvasContainer
      onClick={() => {
        core.ui.unselectSelectedElement();
      }}>
      <Toolbar />
      <EditProperties />
      {elementIds.map((id) => (
        <Rectangle key={id} id={id} />
      ))}
    </CanvasContainer>
  );
};

export default Canvas;
