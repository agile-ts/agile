import './App.css';
import { MY_STATE, MY_STATE_2 } from './core';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div className={'Container'}>
          <h3 className={'Title'}>My State</h3>
          <button onClick={() => MY_STATE.set('Test10')}>
            {this.props?.myState}_{this.props.myState2}
          </button>
        </div>

        <div className={'Container'}>
          <h3 className={'Title'}>My State_2</h3>
          <button onClick={() => MY_STATE_2.set('Test3')}>
            {this.props?.myState}_{this.props.myState2}
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
