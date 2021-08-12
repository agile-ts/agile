import React from 'react';
import { createStore, update } from 'nanostores';
import { useStore } from 'nanostores/react';

const COUNTER_A = createStore(() => {
  COUNTER_A.set(1);
});
const COUNTER_B = createStore(() => {
  COUNTER_B.set(1);
});
const COUNTER_C = createStore(() => {
  COUNTER_C.set(1);
});

const CounterA = () => {
  const count = useStore(COUNTER_A);
  return (
    <div>
      A: {count}{' '}
      <button onClick={() => update(COUNTER_A, (c) => c + 1)}>+1</button>
    </div>
  );
};

const CounterB = () => {
  const count = useStore(COUNTER_B);
  return (
    <div>
      B: {count}{' '}
      <button onClick={() => update(COUNTER_B, (c) => c + 1)}>+1</button>
    </div>
  );
};

const CounterC = () => {
  const count = useStore(COUNTER_C);
  return (
    <div>
      C: {count}{' '}
      <button onClick={() => update(COUNTER_C, (c) => c + 1)}>+1</button>
    </div>
  );
};

export const App = () => (
  <div>
    <p>Nano Stores</p>
    <CounterA />
    <CounterA />
    <CounterB />
    <CounterB />
    <CounterC />
    <CounterC />
  </div>
);
