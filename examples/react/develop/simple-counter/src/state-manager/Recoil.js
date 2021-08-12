import React from 'react';
import { atom, RecoilRoot, useRecoilState } from 'recoil';

const COUNTER_A = atom({
  key: 'counterA',
  default: 1,
});
const COUNTER_B = atom({ key: 'counterB', default: 2 });
const COUNTER_C = atom({ key: 'counterC', default: 3 });

const CounterA = () => {
  const [count, setCount] = useRecoilState(COUNTER_A);
  return (
    <div>
      A: {count} <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
};

const CounterB = () => {
  const [count, setCount] = useRecoilState(COUNTER_B);
  return (
    <div>
      B: {count} <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
};

const CounterC = () => {
  const [count, setCount] = useRecoilState(COUNTER_C);
  return (
    <div>
      C: {count} <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
};

export const App = () => (
  <RecoilRoot>
    <p>Recoil</p>
    <CounterA />
    <CounterA />
    <CounterB />
    <CounterB />
    <CounterC />
    <CounterC />
  </RecoilRoot>
);
