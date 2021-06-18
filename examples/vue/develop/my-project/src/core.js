import { Agile, Logger, globalBind } from '@agile-ts/core';
import vueIntegration from '@agile-ts/vue';

// Create Agile Instance
export const App = new Agile({
  logConfig: { level: Logger.level.DEBUG },
}).integrate(vueIntegration);

// Create State
export const MY_STATE = App.createState('World', {
  key: 'my-state',
}).computeValue((v) => {
  return `Hello ${v}`;
});

// Create Collection
export const TODOS = App.createCollection({
  initialData: [{ id: 1, name: 'Clean Bathroom' }],
  selectors: [1],
}).persist('todos');

// TODOS.collect({ id: 2, name: 'jeff' });

globalBind('__core__', { App, MY_STATE, TODOS });
