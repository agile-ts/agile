import React from 'react';
import { useAgile } from '@agile-ts/react';
import {
  COUNTER,
  incrementCount,
  decrementCount,
  resetCount,
} from '../src/core';

const Counter = () => {
  const count = useAgile(COUNTER);

  return (
    <div>
      <h1>
        Count: <span>{count}</span>
      </h1>
      <button onClick={incrementCount}>+1</button>
      <button onClick={decrementCount}>-1</button>
      <button onClick={resetCount}>Reset</button>
    </div>
  );
};

export default Counter;
