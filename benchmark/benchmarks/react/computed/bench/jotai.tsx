import React from 'react';
import ReactDom from 'react-dom';
import { atom, useAtom } from 'jotai';

const countAtom = atom(0);
const computedCountAtom = atom((get) => get(countAtom) * 5);

const CountView = () => {
  const [count, setCount] = useAtom(countAtom);
  return <h1 onClick={() => setCount((v) => v + 1)}>{count}</h1>;
};

const ComputedCountView = () => {
  const [computedCount] = useAtom(computedCountAtom);
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
  ReactDom.render(<App key={'jotai'} />, target);
}
