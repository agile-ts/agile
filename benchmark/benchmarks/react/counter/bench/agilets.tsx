import React from 'react';
import ReactDom from 'react-dom';
import { Agile, Logger } from '@agile-ts/core';
import { useAgile } from '@agile-ts/react';

const AgileApp = new Agile({ logConfig: { level: Logger.level.ERROR } });
const COUNT = AgileApp.createState(0);

const App = () => {
  const count = useAgile(COUNT);
  return <h1 onClick={() => COUNT.set((state) => state + 1)}>{count}</h1>;
};

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'agilets'} />, target);
}
