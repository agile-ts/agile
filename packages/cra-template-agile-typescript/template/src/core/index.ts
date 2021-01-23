import { Agile, Logger } from '@agile-ts/core';
import reactIntegration from '@agile-ts/react';

export const App = new Agile({
  logConfig: { level: Logger.level.DEBUG, timestamp: true },
}).integrate(reactIntegration);

export const MY_STATE = App.createState<string>('MyState');
export const MY_STATE_2 = App.createState<string>('MyState2', {
  key: 'myState2',
}).persist();
