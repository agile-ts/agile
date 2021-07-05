import React from 'react';
import ReactDom from 'react-dom';
import {
  atom,
  RecoilRoot,
  useRecoilState,
  selector,
  useRecoilValue,
} from 'recoil';
import { useAtom } from 'jotai';

const countState = atom({
  key: 'countState',
  default: 0,
});
const computedCountState = selector({
  key: 'computedCountState',
  get: ({ get }) => {
    return get(countState) * 5;
  },
});

const CountView = () => {
  const [count, setCount] = useRecoilState(countState);
  return <h1 onClick={() => setCount((v) => v + 1)}>{count}</h1>;
};

const ComputedCountView = () => {
  const computedCount = useRecoilValue(computedCountState);
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
  ReactDom.render(
    <RecoilRoot>
      <App key={'recoil'} />
    </RecoilRoot>,
    target
  );
}
