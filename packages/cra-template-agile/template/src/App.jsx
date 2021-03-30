import React from 'react';
import { MY_STATE, MY_STATE_2 } from './core';
import { useAgile } from '@agile-ts/react';
import './App.css';

function App() {
  const [myState, myState2] = useAgile([MY_STATE, MY_STATE_2]);

  return (
    <div className="App">
      <header className="App-header">
        <div className={'Container'}>
          <h3 className={'Title'}>My State</h3>
          <button onClick={() => MY_STATE.set('Test10')}>
            {myState}_{myState2}
          </button>
        </div>

        <div className={'Container'}>
          <h3 className={'Title'}>My State_2</h3>
          <button onClick={() => MY_STATE_2.set('Test3')}>
            {myState}_{myState2}
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
