import { apiUrl, callApi } from '../../../api';
import { ElementImageInterface, ElementStyleInterface } from './ui.interfaces';
import { generateId } from '@agile-ts/core';
import {
  defaultElementStyle,
  SELECTED_ELEMENT,
  ELEMENTS,
} from './ui.controller';

export const addDefaultElement = (image: boolean = false) => {
  if (image) addElement(defaultElementStyle, getRandomImage());
  else addElement(defaultElementStyle);
};

export const addElement = (
  style: ElementStyleInterface,
  image?: ElementImageInterface,
  select = true
) => {
  const id = generateId();
  ELEMENTS.collect({
    id,
    style,
    image,
  });
  if (select) selectElement(id);
};

export const selectElement = (id: string | number) => {
  if (SELECTED_ELEMENT.itemKey !== id) {
    console.log('Select Element', id);
    SELECTED_ELEMENT.select(id);
  }
};

export const unselectSelectedElement = () => {
  SELECTED_ELEMENT.unselect();
};

export const getBorderColor = (visible: boolean) => {
  return visible ? '#000000' : 'transparent';
};

export const fetchImage = async (imageId: number): Promise<any> => {
  return callApi('image-details', {
    queryParams: { seed: imageId },
  });
};

/**
 * Returns the width and height for the specified image.
 */
export const getImageDimensions = (src: string) => {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = (error) => {
      reject(error);
    };
    image.src = src;
  });
};

/**
 * A function that returns a random image URL and that image's
 * id, which can be used to refer back to that image in API requests.
 */
export const getRandomImage = (): ElementImageInterface => {
  const id = Date.now();
  return { src: apiUrl('random-image', { seed: id }), id };
};
