import React from 'react';
import { atom, useAtom } from 'jotai';

const COUNTER_A = atom(1);
const COUNTER_B = atom(2);
const COUNTER_C = atom(3);

const CounterA = () => {
  const [count, setCount] = useAtom(COUNTER_A);
  return (
    <div>
      A: {count} <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
};

const CounterB = () => {
  const [count, setCount] = useAtom(COUNTER_B);
  return (
    <div>
      B: {count} <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
};

const CounterC = () => {
  const [count, setCount] = useAtom(COUNTER_C);
  return (
    <div>
      C: {count} <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
};

export const App = () => (
  <div>
    <p>Jotai</p>
    <CounterA />
    <CounterA />
    <CounterB />
    <CounterB />
    <CounterC />
    <CounterC />
  </div>
);
