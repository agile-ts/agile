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
  ReactDom.render(<App key={'agilets-hard-coded'} />, target);
}
