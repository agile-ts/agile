import React from 'react';
import { createState } from '@agile-ts/core';
import { useAgile, useValue } from '@agile-ts/react';

const COUNTER_A = createState(1);
const COUNTER_B = createState(2);
const COUNTER_C = createState(3);

const CounterA = () => {
  const count = useAgile(COUNTER_A);
  return (
    <div>
      A: {count} <button onClick={() => COUNTER_A.set((c) => c + 1)}>+1</button>
    </div>
  );
};

const CounterB = () => {
  const count = useValue(COUNTER_B);
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
