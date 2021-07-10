import React from 'react';
import ReactDom from 'react-dom';
import { createStore, getValue } from 'nanostores';
import { useStore } from 'nanostores/react';

const countStore = createStore<number>(() => {
  countStore.set(0);
});

const App = () => {
  const count = useStore(countStore);
  return (
    <h1 onClick={() => countStore.set(getValue(countStore) + 1)}>{count}</h1>
  );
};

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'nanostores'} />, target);
}
