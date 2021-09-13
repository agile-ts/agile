import {
  globalBind,
  createState,
  createComputed,
  createCollection,
} from '@agile-ts/core';
import { Logger, assignSharedAgileLoggerConfig } from '@agile-ts/logger';
import '@agile-ts/vue';

assignSharedAgileLoggerConfig({ level: Logger.level.DEBUG });

// console.debug('hi'); // Doesn't work here idk why

// Create State
export const MY_STATE = createState('World', {
  key: 'my-state',
}).computeValue((v) => {
  return `Hello ${v}`;
});

export const MY_COMPUTED = createComputed(
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return `${MY_STATE.value} Frank`;
  },
  { autodetect: false, computedDeps: [MY_STATE] }
);

// Create Collection
export const TODOS = createCollection({
  initialData: [{ id: 1, name: 'Clean Bathroom' }],
  selectors: [1],
}).persist('todos');

// TODOS.collect({ id: 2, name: 'jeff' });

globalBind('__core__', { App, MY_STATE, TODOS, MY_COMPUTED });
