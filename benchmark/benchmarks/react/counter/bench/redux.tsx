import React from 'react';
import ReactDom from 'react-dom';
import { combineReducers, createStore } from 'redux';
import { Provider, useDispatch, useSelector } from 'react-redux';

const increment = () => {
  return {
    type: 'INCREMENT',
  };
};

const counter = (state = 0, action: any) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  counter,
});

const store = createStore(rootReducer);

const App = () => {
  const count = useSelector((state: any) => state.counter);
  const dispatch = useDispatch();

  return <h1 onClick={() => dispatch(increment())}>{count}</h1>;
};

export default function (target: HTMLElement) {
  ReactDom.render(
    <Provider store={store}>
      <App key={'redux'} />
    </Provider>,
    target
  );
}
