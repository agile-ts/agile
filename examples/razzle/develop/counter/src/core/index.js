import { createState } from '@agile-ts/core';

export const COUNTER = createState(0);

export const incrementCount = () => COUNTER.set((v) => v + 1);
export const decrementCount = () => COUNTER.set((v) => v - 1);
export const resetCount = () => COUNTER.reset();
