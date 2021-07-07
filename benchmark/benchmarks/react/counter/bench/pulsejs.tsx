import React from 'react';
import ReactDom from 'react-dom';
import { state } from '@pulsejs/core';
import { usePulse } from '@pulsejs/react';

const COUNT = state(0);

const App = () => {
  const count = usePulse(COUNT);
  return <h1 onClick={() => COUNT.set((state) => state + 1)}>{count}</h1>;
};

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'pulsejs'} />, target);
}
