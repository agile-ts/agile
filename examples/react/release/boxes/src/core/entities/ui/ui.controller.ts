import { App } from '../../app';
import { CanvasInterface, ElementInterface } from './ui.interfaces';

export const defaultElementStyle = {
  position: { top: 0, left: 0 },
  size: { width: 200, height: 200 },
};

export const CANVAS = App.createState<CanvasInterface>({
  width: 5000,
  height: 5000,
});

export const ELEMENTS = App.createCollection<ElementInterface>();

export const SELECTED_ELEMENT = ELEMENTS.createSelector(
  'selectedElement',
  null
);
