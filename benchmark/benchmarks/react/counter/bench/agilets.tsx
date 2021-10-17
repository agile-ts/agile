import React from 'react';
import ReactDom from 'react-dom';
import { createState, shared, logCodeManager } from '@agile-ts/core';
import reactIntegration, { useAgile } from '@agile-ts/react';

logCodeManager.allowLogging = false;
shared.integrate(reactIntegration);

const COUNT = createState(0);

const App = () => {
  const count = useAgile(COUNT);
  return <h1 onClick={() => COUNT.set((state) => state + 1)}>{count}</h1>;
};

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'agilets'} />, target);
}
