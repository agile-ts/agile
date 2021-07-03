import React from 'react';
import ReactDom from 'react-dom';
import { createState, useHookstate } from '@hookstate/core';

const counter = createState(0);

const App = () => {
  const state = useHookstate(counter);
  return <h1 onClick={() => state.set((v) => v + 1)}>{state.get()}</h1>;
};

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'hookstate'} />, target);
}
