import { createState } from '@agile-ts/core';
import { useAgile } from '@agile-ts/react';

const MY_STATE = createState('hi');

console.log(MY_STATE.value);

useAgile(MY_STATE);
