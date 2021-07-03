import React from 'react';
import ReactDom from 'react-dom';
import { proxy, useSnapshot } from 'valtio';

const state = proxy({ count: 0 });

function App() {
  const snapshot = useSnapshot(state, { sync: true });
  return <h1 onClick={() => state.count++}>{snapshot.count}</h1>;
}

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'valito'} />, target);
}
