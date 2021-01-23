import { Agile, Logger } from '@agile-ts/core';

export const App = new Agile({
  logConfig: { level: Logger.level.DEBUG, timestamp: true },
});

export const MY_STATE = App.createState('MyState');
export const MY_STATE_2 = App.createState('MyState2', {
  key: 'myState2',
}).persist();
