import React from 'react';
import ReactDom from 'react-dom';
import { atom, useAtom } from 'jotai';

const countAtom = atom(0);
const computedCountAtom = atom((get) => get(countAtom) * 5);

const App = () => {
  const [count, setCount] = useAtom(countAtom);
  const [computedCount] = useAtom(computedCountAtom);
  return (
    <div>
      <h1 onClick={() => setCount((v) => v + 1)}>{count}</h1>
      <p>{computedCount}</p>
    </div>
  );
};

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'jotai'} />, target);
}
