import { Agile, globalBind, Logger } from '@agile-ts/core';
import vueIntegration from '@agile-ts/vue';

// Create Agile Instance
export const App = new Agile({
  logConfig: { level: Logger.level.DEBUG },
}).integrate(vueIntegration);

// console.debug('hi'); // Doesn't work here idk why

// Create State
export const MY_STATE = App.createState('World', {
  key: 'my-state',
}).computeValue((v) => {
  return `Hello ${v}`;
});

export const MY_COMPUTED = App.createComputed(
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return `${MY_STATE.value} Frank`;
  },
  { autodetect: false, computedDeps: [MY_STATE] }
);

// Create Collection
export const TODOS = App.createCollection({
  initialData: [{ id: 1, name: 'Clean Bathroom' }],
  selectors: [1],
}).persist('todos');

// TODOS.collect({ id: 2, name: 'jeff' });

globalBind('__core__', { App, MY_STATE, TODOS, MY_COMPUTED });
