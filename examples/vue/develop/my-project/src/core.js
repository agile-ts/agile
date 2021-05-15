import { Agile, Logger } from '@agile-ts/core';
import vueIntegration from '@agile-ts/vue';

// Create Agile Instance
export const App = new Agile({
  logConfig: { level: Logger.level.DEBUG },
}).integrate(vueIntegration);

// Create State
export const MY_STATE = App.createState('Hello World');

// Create Collection
export const TODOS = App.createCollection({
  initialData: [{ id: 1, name: 'Clean Bathroom' }],
}).persist('todos');
