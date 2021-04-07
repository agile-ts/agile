import React, { useEffect } from 'react';
import './App.css';
import { useAgile, useWatcher } from '@agile-ts/react';
import { useEvent } from '@agile-ts/event';
import {
  MY_COLLECTION,
  MY_COMPUTED,
  MY_EVENT,
  MY_STATE,
  MY_STATE_2,
  MY_STATE_3,
} from './core';
import { globalBind } from '@agile-ts/core';

let rerenderCount = 0;

const App = (props: any) => {
  // Note: Rerenders twice because of React Strickt Mode (also useState does trigger a rerender twice)
  // https://stackoverflow.com/questions/54927622/usestate-do-double-render
  rerenderCount++;

  const myComputed = useAgile(MY_COMPUTED);
  const [
    myState,
    myState2,
    item,
    mySelector2,
    myState3,
    myUndefined,
    myCollection,
  ] = useAgile([
    MY_STATE,
    MY_STATE_2,
    MY_COLLECTION.getItem('1'),
    MY_COLLECTION.getSelector('mySelector'),
    MY_STATE_3,
    undefined,
    MY_COLLECTION,
  ]);
  const [myGroup] = useAgile([MY_COLLECTION.getGroupWithReference('myGroup')]);

  // const myCollection2 = useAgile(MY_COLLECTION);

  const mySelector = useAgile(MY_COLLECTION.getSelector('mySelector'));

  useEvent(MY_EVENT, () => {
    console.log('Triggered Event (useEvent)');
  });

  useWatcher(MY_STATE, () => {
    console.log('MY_STATE changes');
  });

  // Create global Instance of Core (for better debugging)
  useEffect(() => {
    globalBind('__core__', { ...require('./core') });
  }, []);

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

        <div className={'Container'}>
          <h3 className={'Title'}>My Computed</h3>
          <p>{myComputed}</p>
        </div>

        <div className={'Container'}>
          <h3 className={'Title'}>My Event</h3>
          <button onClick={() => MY_EVENT.trigger({ name: 'test' })}>
            Trigger
          </button>
        </div>

        <div className={'Container'}>
          <h3 className={'Title'}>My Collection</h3>
          <div>
            {myGroup.map((item) => (
              <p key={item.id}>{item.name}</p>
            ))}
          </div>
          <button
            onClick={() => MY_COLLECTION.collect({ id: 'id3', name: 'Test3' })}>
            Collect
          </button>
          <button onClick={() => MY_COLLECTION.getGroup('myGroup')?.add('id3')}>
            Add to myGroup
          </button>
          <button
            onClick={() =>
              MY_COLLECTION.update('id3', {
                id: 'newId3',
                name: 'Test3_Changed',
              })
            }>
            Update id3
          </button>
          <button onClick={() => MY_COLLECTION.remove('newId3').everywhere()}>
            Remove newId3
          </button>
        </div>

        <p>MySelector: {mySelector?.name}</p>

        <button onClick={() => MY_COLLECTION.removeSelector('mySelector')}>
          Remove mySelector
        </button>
        <button
          onClick={() =>
            MY_COLLECTION.getSelector('mySelector')?.patch({ name: 'frank' })
          }>
          Update mySelector value
        </button>
        <p>{rerenderCount}</p>
      </header>
    </div>
  );
};

export default App;
