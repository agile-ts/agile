import React from 'react';
import ReactDom from 'react-dom';
import { createState, LogCodeManager } from '@agile-ts/core';
import { useAgile } from '@agile-ts/react';

LogCodeManager.getLogger().isActive = false;
const COUNT = createState(0);

const App = () => {
  const count = useAgile(COUNT, undefined);
  return <h1 onClick={() => COUNT.set((state) => state + 1)}>{count}</h1>;
};

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'agilets'} />, target);
}
