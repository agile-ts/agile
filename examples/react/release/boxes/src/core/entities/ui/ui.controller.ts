import { App } from '../../app';
import { ElementInterface } from './ui.interfaces';

export const defaultElementStyle = {
  position: { top: 0, left: 0 },
  size: { width: 200, height: 200 },
};

export const ELEMENTS = App.createCollection<ElementInterface>();

export const SELECTED_ELEMENT = ELEMENTS.createSelector(
  'selectedElement',
  null
);
