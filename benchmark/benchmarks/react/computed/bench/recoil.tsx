import React from 'react';
import ReactDom from 'react-dom';
import {
  atom,
  RecoilRoot,
  useRecoilState,
  selector,
  useRecoilValue,
} from 'recoil';

const counterState = atom({
  key: 'counterState',
  default: 0,
});
const computedCounterState = selector({
  key: 'computedCounterState',
  get: ({ get }) => {
    return get(counterState) * 5;
  },
});

const App = () => {
  const [count, setCount] = useRecoilState(counterState);
  const computedCount = useRecoilValue(computedCounterState);
  return (
    <div>
      <h1 onClick={() => setCount((v) => v + 1)}>{count}</h1>
      <p>{computedCount}</p>
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
