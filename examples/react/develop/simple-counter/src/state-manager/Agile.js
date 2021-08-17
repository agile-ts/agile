import React from 'react';
import { createLightState } from '@agile-ts/core';
import { useAgile } from '@agile-ts/react';

// registerStorageManager(createStorageManager({ localStorage: true }));
// const COUNTER_A = createState(1).persist('persistKey');
const COUNTER_A = createLightState(1);
const COUNTER_B = createLightState(2);
const COUNTER_C = createLightState(3);

const CounterA = () => {
  const count = useAgile(COUNTER_A);
  return (
    <div>
      A: {count} <button onClick={() => COUNTER_A.set((c) => c + 1)}>+1</button>
    </div>
  );
};

const CounterB = () => {
  const count = useAgile(COUNTER_B);
  return (
    <div>
      B: {count} <button onClick={() => COUNTER_B.set((c) => c + 1)}>+1</button>
    </div>
  );
};

const CounterC = () => {
  const count = useAgile(COUNTER_C);
  return (
    <div>
      C: {count} <button onClick={() => COUNTER_C.set((c) => c + 1)}>+1</button>
    </div>
  );
};

export const App = () => (
  <div>
    <p>Agile</p>
    <CounterA />
    <CounterA />
    <CounterB />
    <CounterB />
    <CounterC />
    <CounterC />
  </div>
);
