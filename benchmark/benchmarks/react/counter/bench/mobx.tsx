import React from 'react';
import ReactDom from 'react-dom';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';

const appState = observable({
  count: 0,
  increment: action(function () {
    appState.count += 1;
  }),
});

const App = observer(() => {
  return <h1 onClick={appState.increment}>{appState.count}</h1>;
});

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'mobx'} />, target);
}
