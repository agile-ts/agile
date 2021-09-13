import React from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useSelector, useDispatch } from 'react-redux';

const counterSlice_A = createSlice({
  name: 'counterA',
  initialState: {
    value: 0,
  },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
  },
});

const counterSlice_B = createSlice({
  name: 'counterB',
  initialState: {
    value: 0,
  },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
  },
});

const counterSlice_C = createSlice({
  name: 'counterC',
  initialState: {
    value: 0,
  },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
  },
});

const store = configureStore({
  reducer: {
    counterA: counterSlice_A.reducer,
    counterB: counterSlice_B.reducer,
    counterC: counterSlice_C.reducer,
  },
});

const CounterA = () => {
  const count = useSelector((state) => state.counterA?.value);
  const dispatch = useDispatch();
  return (
    <div>
      A: {count}{' '}
      <button onClick={() => dispatch(counterSlice_A.actions.increment())}>
        +1
      </button>
    </div>
  );
};

const CounterB = () => {
  const count = useSelector((state) => state.counterB?.value);
  const dispatch = useDispatch();
  return (
    <div>
      B: {count}{' '}
      <button onClick={() => dispatch(counterSlice_B.actions.increment())}>
        +1
      </button>
    </div>
  );
};

const CounterC = () => {
  const count = useSelector((state) => state.counterC?.value);
  const dispatch = useDispatch();
  return (
    <div>
      C: {count}{' '}
      <button onClick={() => dispatch(counterSlice_C.actions.increment())}>
        +1
      </button>
    </div>
  );
};

export const App = () => (
  <Provider store={store}>
    <p>Redux Toolkit</p>
    <CounterA />
    <CounterA />
    <CounterB />
    <CounterB />
    <CounterC />
    <CounterC />
  </Provider>
);
