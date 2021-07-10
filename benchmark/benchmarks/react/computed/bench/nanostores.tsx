import React from 'react';
import ReactDom from 'react-dom';
import { createDerived, createStore, getValue } from 'nanostores';
import { useStore } from 'nanostores/react';

const countStore = createStore<number>(() => {
  countStore.set(0);
});
const computedStore = createDerived(countStore, (count) => {
  return count * 5;
});

const CountView = () => {
  const count = useStore(countStore);
  return (
    <h1 onClick={() => countStore.set(getValue(countStore) + 1)}>{count}</h1>
  );
};

const ComputedCountView = () => {
  const computedCount = useStore(computedStore);
  return <p>{computedCount}</p>;
};

const App = () => {
  return (
    <div>
      <CountView />
      <ComputedCountView />
    </div>
  );
};

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'nanostores'} />, target);
}
