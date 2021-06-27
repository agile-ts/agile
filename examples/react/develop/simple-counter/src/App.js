import { Agile } from '@agile-ts/core';
import { useAgile } from '@agile-ts/react';

const AgileApp = new Agile();

const COUNTER_A = AgileApp.createState(1);
const COUNTER_B = AgileApp.createState(2);
const COUNTER_C = AgileApp.createState(3);

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

const App = () => (
  <div>
    <CounterA />
    <CounterA />
    <CounterB />
    <CounterB />
    <CounterC />
    <CounterC />
  </div>
);

export default App;
