import React from 'react';
import logo from './logo.svg';
import './App.css';
import {useAgile} from 'agile-framework';
import {MY_COLLECTION, MY_COMPUTED, MY_STATE, MY_STATE_2} from "./core";

const App = (props: any) => {

    const [myComputed] = useAgile([MY_COMPUTED]);
    const [myState, myState2] = useAgile([MY_STATE, MY_STATE_2]);
    const [myCollection] = useAgile([MY_COLLECTION.getGroup('myGroup')]);


    console.log("myComputed", MY_COMPUTED);
    console.log("myState", MY_STATE);
    console.log("myState2", MY_STATE_2);
    console.log("myCollection", MY_COLLECTION);


    return (
        <div className="App">
            <header className="App-header">

                <div className={"Container"}>
                    <h3 className={"Title"}>My State</h3>
                    <button onClick={() => setTimeout(() => {
                        MY_STATE.set("Test1");
                    }, 1000)}>
                        {myState}_{myState2}
                    </button>
                </div>

                <div className={"Container"}>
                    <h3 className={"Title"}>My State_2</h3>
                    <button onClick={() => setTimeout(() => {
                        MY_STATE_2.set("Test3");
                    }, 1000)}>
                        {myState}_{myState2}
                    </button>
                </div>

                <div className={"Container"}>
                    <h3 className={"Title"}>My Computed</h3>
                    <p>
                        {myComputed}
                    </p>
                </div>

                <div className={"Container"}>
                    <h3 className={"Title"}>My Collection</h3>
                    <div>
                        {
                            myCollection.map((item: any) => <p>{item.name}</p>)
                        }
                    </div>
                    <button onClick={() => setTimeout(() => {
                        MY_COLLECTION.collect({id: 'id3', name: 'Test3'});
                    }, 1000)}>
                        Collect
                    </button>
                </div>

            </header>
        </div>
    );
}

export default App;
