import React from 'react';
import ReactDom from 'react-dom';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';

const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    count: 0,
  },
  reducers: {
    increment: (state) => {
      state.count += 1;
    },
  },
});

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

const App = () => {
  const count = useSelector((state: any) => state.counter.count);
  const dispatch = useDispatch();

  return (
    <h1 onClick={() => dispatch(counterSlice.actions.increment())}>{count}</h1>
  );
};

export default function (target: HTMLElement) {
  ReactDom.render(
    <Provider store={store}>
      <App key={'redux-toolkit'} />
    </Provider>,
    target
  );
}
