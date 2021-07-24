import { apiUrl, callApi } from '../../../api';
import { ElementImageInterface, ElementStyleInterface } from './ui.interfaces';
import { generateId } from '@agile-ts/core';
import {
  defaultElementStyle,
  SELECTED_ELEMENT,
  ELEMENTS,
  SCREEN,
} from './ui.controller';
import core from '../../index';
import { copy } from '@agile-ts/utils';

export const addDefaultElement = (image: boolean = false) => {
  if (image) addElement(defaultElementStyle, getRandomImage());
  else addElement(defaultElementStyle);
};

export const addElement = async (
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

  if (select) {
    // TODO figure out why this timeout is needed
    //  (otherwise it won't select the Element initially)
    await new Promise((resolve) => setTimeout(resolve, 10));
    selectElement(id);
  }
};

export const selectElement = (id: string | number) => {
  if (SELECTED_ELEMENT.itemKey !== id) {
    SELECTED_ELEMENT.select(id);
  }
};

export const updateElementStyle = (
  id: string | number,
  style: ElementStyleInterface
) => {
  const element = ELEMENTS.getItem(id);
  if (element) {
    element.nextStateValue.style = style;
    element.ingest();
  }
};

export const updateElementSize = (
  id: string | number,
  size: ElementStyleInterface['size']
) => {
  const element = ELEMENTS.getItem(id);
  if (element) {
    element.nextStateValue.style.size = size;
    element.ingest();
  }
};

export const updateElementWidth = (
  id: string | number,
  newWidth: number,
  aspectRatio?: boolean
) => {
  const element = ELEMENTS.getItem(id);

  if (element) {
    if (aspectRatio == null) aspectRatio = !!element.value.image;
    if (aspectRatio) {
      const { width, height } = element.value.style.size;
      const ar = width / height;

      element.nextStateValue.style.size = {
        width: newWidth,
        height: Math.round(newWidth / ar),
      };
    } else {
      element.nextStateValue.style.size.width = newWidth;
    }
    element.ingest();
  }
};

export const updateElementHeight = (
  id: string | number,
  newHeight: number,
  aspectRatio?: boolean
) => {
  const element = ELEMENTS.getItem(id);

  if (element) {
    if (aspectRatio == null) aspectRatio = !!element.value.image;
    if (aspectRatio) {
      const { width, height } = element.value.style.size;
      const ar = width / height;

      element.nextStateValue.style.size = {
        height: newHeight,
        width: Math.round(newHeight * ar),
      };
    } else {
      element.nextStateValue.style.size.height = newHeight;
    }
    element.ingest();
  }
};

export const updateElementPosition = (
  id: string | number,
  position: ElementStyleInterface['position']
) => {
  const element = ELEMENTS.getItem(id);
  if (element) {
    element.nextStateValue.style.position = position;
    element.ingest();

    // TODO implement logic to follow the box with scrolling if it is out of the 'User View'
    // // Coordinates of the User View
    // const userViewX = element.value.style.position.left - window.scrollX;
    // const userViewY = element.value.style.position.top - window.scrollY;
    //
    // const userViewOffsetX =
    //   (userViewX -
    //     SCREEN.value.width +
    //     element.nextStateValue.style.size.width) *
    //   -1;
    //
    // console.log(userViewOffsetX);
    //
    // if (userViewOffsetX <= 0) {
    //   window.scrollTo({
    //     left:
    //       element.nextStateValue.style.position.left / 2 +
    //       element.nextStateValue.style.size.width,
    //     behavior: 'smooth',
    //   });
    // }
    //
    // if (userViewX <= 0) {
    //   // Scroll left
    // }
  }
};

export const updateElementX = (id: string | number, x: number) => {
  const element = ELEMENTS.getItem(id);
  if (element) {
    element.nextStateValue.style.position.left = x;
    element.ingest();
  }
};

export const updateElementY = (id: string | number, y: number) => {
  const element = ELEMENTS.getItem(id);
  if (element) {
    element.nextStateValue.style.position.top = y;
    element.ingest();
  }
};

export const applyImageDimensions = async (id: string | number) => {
  const element = ELEMENTS.getItem(id);
  if (element && element.value.image?.src) {
    const newDimensions = await core.ui.getImageDimensions(
      element.value.image.src
    );
    element.nextStateValue.style.size = newDimensions;
    element.ingest();
  }
};

export const unselectSelectedElement = () => {
  SELECTED_ELEMENT.unselect();
};

export const deleteSelectedElement = () => {
  const toRemoveElementKey = SELECTED_ELEMENT.itemKey;
  if (toRemoveElementKey != null)
    ELEMENTS.remove(toRemoveElementKey).everywhere();
};

export const assignDefaultElementStyle = (
  windowWidth: number,
  windowHeight: number
) => {
  core.ui.defaultElementStyle.position = {
    left: Math.floor(
      windowWidth / 2 - core.ui.defaultElementStyle.size.width / 2
    ),
    top: Math.floor(
      windowHeight / 2 - core.ui.defaultElementStyle.size.height / 2
    ),
  };
};

export const updateScreenDimensions = (
  windowWidth?: number,
  windowHeight?: number
) => {
  if (windowWidth != null && windowHeight != null) {
    assignDefaultElementStyle(windowWidth, windowHeight);
    SCREEN.set({ width: windowWidth, height: windowHeight });
  }
};

export const getBorderColor = (visible: boolean) => {
  return visible ? '#000000' : 'rgba(0, 0, 0, 0)';
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
