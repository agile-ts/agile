import { createState } from '@agile-ts/core';

export const COUNTER = createState(0);
export const LAST_UPDATED_TIMESTAMP = createState(0);
export const LIGHT = createState(false);

export const tick = (lastUpdatedTimestamp: number, light: boolean) => {
  LAST_UPDATED_TIMESTAMP.set(lastUpdatedTimestamp);
  LIGHT.set(light);
};

export const incrementCount = () => COUNTER.set((v) => v + 1);
export const decrementCount = () => COUNTER.set((v) => v - 1);
export const resetCount = () => COUNTER.reset();

interface PreloadedStateInterface {
  counter: number;
  lastUpdatedTimestamp: number;
  light: boolean;
}

export const initializeCore = (preloadedState: PreloadedStateInterface) => {
  if (preloadedState != null) {
    COUNTER.set(preloadedState.counter);
    LAST_UPDATED_TIMESTAMP.set(preloadedState.lastUpdatedTimestamp);
    LIGHT.set(preloadedState.light);
  }
};
