import React from 'react';
import ReactDom from 'react-dom';
import { Agile, Logger } from '@agile-ts/core';
import { useAgile } from '@agile-ts/react';

const AgileApp = new Agile({ logConfig: { level: Logger.level.ERROR } });
const COUNT = AgileApp.createState(0);
const COMPUTED_COUNT = AgileApp.createComputed(
  () => {
    return COUNT.value * 5;
  },
  { autodetect: false, computedDeps: [COUNT] }
);

const App = () => {
  const [count, computedCount] = useAgile([COUNT, COMPUTED_COUNT]);
  return (
    <div>
      <h1 onClick={() => COUNT.set((state) => state + 1)}>{count}</h1>
      <p>{computedCount}</p>
    </div>
  );
};

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'agilets-hard-coded'} />, target);
}
