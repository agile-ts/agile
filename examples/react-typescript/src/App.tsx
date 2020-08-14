import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';
import {useAgile} from 'agile-framework';
import {Test} from "./core";

function App() {

   // const [myState] = useAgile([MY_STATE]);
    const [test, setTest] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
            {Test}
        </a>
      </header>
    </div>
  );
}

export default App;
