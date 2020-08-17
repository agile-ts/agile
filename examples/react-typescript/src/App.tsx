import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';
import {useAgile, AgileHOC} from 'agile-framework';
import {MY_STATE, MY_STATE_2, Test} from "./core";

const App = (props: any) => {

    // const [myState] = useAgile([MY_STATE]);
    const [test, setTest] = useState(false);

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <button onClick={() => setTimeout(() => {MY_STATE.set("Test2");}, 3000)}>
                    {props.myState}_{props.myState2}
                </button>
            </header>
        </div>
    );
}

export default AgileHOC(App, {myState: MY_STATE, myState2: MY_STATE_2});
