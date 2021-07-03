import React from 'react';
import ReactDom from 'react-dom';
import { atom, useAtom } from 'jotai';

const countAtom = atom(0);

const App = () => {
  const [count, setCount] = useAtom(countAtom);
  return <h1 onClick={() => setCount((state) => state + 1)}>{count}</h1>;
};

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'jotai'} />, target);
}
