import React from 'react';
import { createState, useState } from '@hookstate/core';

const COUNTER_A = createState(1);
const COUNTER_B = createState(2);
const COUNTER_C = createState(3);

const CounterA = () => {
  const count = useState(COUNTER_A);
  return (
    <div>
      A: {count.get()}{' '}
      <button onClick={() => count.set((c) => c + 1)}>+1</button>
    </div>
  );
};

const CounterB = () => {
  const count = useState(COUNTER_B);
  return (
    <div>
      B: {count.get()}{' '}
      <button onClick={() => count.set((c) => c + 1)}>+1</button>
    </div>
  );
};

const CounterC = () => {
  const count = useState(COUNTER_C);
  return (
    <div>
      C: {count.get()}{' '}
      <button onClick={() => count.set((c) => c + 1)}>+1</button>
    </div>
  );
};

export const App = () => (
  <div>
    <p>Hookstate</p>
    <CounterA />
    <CounterA />
    <CounterB />
    <CounterB />
    <CounterC />
    <CounterC />
  </div>
);
