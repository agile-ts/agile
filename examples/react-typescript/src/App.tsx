import React from 'react';
import logo from './logo.svg';
import './App.css';
import {useAgile} from 'agile-framework';
import {MY_COMPUTED, MY_STATE, MY_STATE_2} from "./core";

const App = (props: any) => {

    const [myComputed] = useAgile([MY_COMPUTED]);
    const [myState, myState2] = useAgile([MY_STATE, MY_STATE_2]);


    console.log("myComputed", MY_COMPUTED);
    console.log("myState", MY_STATE);

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <button onClick={() => setTimeout(() => {
                    MY_STATE.set("Test4");
                }, 1000)}>
                    {myState}_{myState2}
                </button>
                <button onClick={() => setTimeout(() => {
                    MY_STATE_2.set("Test6");
                }, 1000)}>
                    {myState}_{myState2}
                </button>
                <p>
                    {myComputed}
                </p>
            </header>
        </div>
    );
}

export default App;
