import React from 'react';
import ReactDom from 'react-dom';
import { createComputed, createState, LogCodeManager } from '@agile-ts/core';
import { useAgile } from '@agile-ts/react';

LogCodeManager.getLogger().isActive = false;
const COUNT = createState(0);
const COMPUTED_COUNT = createComputed(() => {
  return COUNT.value * 5;
});

const CountView = () => {
  const count = useAgile(COUNT);
  return <h1 onClick={() => COUNT.set((state) => state + 1)}>{count}</h1>;
};

const ComputedCountView = () => {
  const computedCount = useAgile(COMPUTED_COUNT);
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
  ReactDom.render(<App key={'agilets-auto-tracking'} />, target);
}
