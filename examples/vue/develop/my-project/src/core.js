import {
  globalBind,
  createState,
  createComputed,
  createCollection,
  shared,
} from '@agile-ts/core';
import { assignSharedLogger, createLogger, Logger } from '@agile-ts/logger';
import vueIntegration from '@agile-ts/vue';

assignSharedLogger(createLogger({ level: Logger.level.DEBUG }));
shared.integrate(vueIntegration);

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

globalBind('__core__', { MY_STATE, TODOS, MY_COMPUTED, shared });
