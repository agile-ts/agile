import { createState } from '@agile-ts/core';

export const MY_STATE = createState('MyState');
export const MY_STATE_2 = createState('MyState2', {
  key: 'myState2',
}).persist();
