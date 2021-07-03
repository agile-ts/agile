import React from 'react';
import ReactDom from 'react-dom';
import create from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

const App = () => {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);

  return <h1 onClick={() => increment()}>{count}</h1>;
};

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'zustand'} />, target);
}
