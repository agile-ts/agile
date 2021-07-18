import useInterval from '../src/useInterval';
import Nav from './Nav';
import Clock from './Clock';
import Counter from './Counter';
import { tick } from '../src/core';

const Page = () => {
  // Tick the time every second
  useInterval(() => {
    tick(Date.now(), true);
  }, 1000);

  return (
    <>
      <Nav />
      <Clock />
      <Counter />
    </>
  );
};

export default Page;
