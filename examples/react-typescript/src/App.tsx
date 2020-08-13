import React from 'react';
import './App.css';
import {useAgile} from "agile-framework";
import {TEST_STATE} from "./core";

function App() {

  // const [testState]: string[] = useAgile([TEST_STATE]);

  console.log("Rerender ", TEST_STATE.value);

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>

      </header>
    </div>
  );
}

export default App;
