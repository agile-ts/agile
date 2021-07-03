import React from 'react';
import ReactDom from 'react-dom';
import { atom, RecoilRoot, useRecoilState } from 'recoil';

const counterState = atom({
  key: 'counterState',
  default: 0,
});

const App = () => {
  const [count, setCount] = useRecoilState(counterState);
  return <h1 onClick={() => setCount((v) => v + 1)}>{count}</h1>;
};

export default function (target: HTMLElement) {
  ReactDom.render(
    <RecoilRoot>
      <App key={'recoil'} />
    </RecoilRoot>,
    target
  );
}
