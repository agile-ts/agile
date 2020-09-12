import React from 'react';
import './App.css';
import {useAgile, useEvent} from 'agile-framework';
import {MY_COLLECTION, MY_COMPUTED, MY_EVENT, MY_STATE, MY_STATE_2} from "./core";

const App = (props: any) => {

    const [myComputed] = useAgile([MY_COMPUTED]);
    const [myState, myState2] = useAgile([MY_STATE, MY_STATE_2]);
    const [myCollection] = useAgile([MY_COLLECTION.getGroup('myGroup')]);
    const mySelector = useAgile(MY_COLLECTION.getSelector('mySelector'));

    useEvent(MY_EVENT, () => {
        console.log("Triggered Event");
    });

    console.log("myComputed", MY_COMPUTED);
    console.log("myState", MY_STATE);
    console.log("myState2", MY_STATE_2);
    console.log("myCollection", MY_COLLECTION);
    console.log("myEvent", MY_EVENT);


    return (
        <div className="App">
            <header className="App-header">

                <div className={"Container"}>
                    <h3 className={"Title"}>My State</h3>
                    <button onClick={() => setTimeout(() => {
                        MY_STATE.set("Test10");
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
                    <h3 className={"Title"}>My Event</h3>
                    <button onClick={() => setTimeout(() => {
                        MY_EVENT.trigger({name: 'test'})
                    }, 1000)}>
                        Trigger
                    </button>
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
                    <button onClick={() => setTimeout(() => {
                        MY_COLLECTION.getGroup('myGroup').add('id3');
                    }, 1000)}>
                        Add to myGroup
                    </button>
                    <button onClick={() => setTimeout(() => {
                        MY_COLLECTION.update("id3", {id: 'newId3', name: 'Test3_Changed'});
                    }, 1000)}>
                        Update id3
                    </button>
                    <button onClick={() => setTimeout(() => {
                        MY_COLLECTION.remove("newId3").everywhere();
                    }, 1000)}>
                        Remove newId3
                    </button>
                </div>

                <p>MySelector: {mySelector?.name}</p>

            </header>
        </div>
    );
}

export default App;
