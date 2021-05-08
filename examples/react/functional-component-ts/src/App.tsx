import React, { useEffect } from 'react';
import './App.css';
import { useAgile, useWatcher, useProxy } from '@agile-ts/react';
import { useEvent } from '@agile-ts/event';
import {
  COUNTUP,
  MY_COLLECTION,
  MY_COMPUTED,
  MY_EVENT,
  MY_STATE,
  MY_STATE_2,
  MY_STATE_3,
  STATE_OBJECT,
} from './core';
import { generateId, globalBind } from '@agile-ts/core';

let rerenderCount = 0;
let rerenderCountInCountupView = 0;

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
    MY_COLLECTION.getItem('id1'),
    MY_COLLECTION.getSelector('mySelector'),
    MY_STATE_3,
    undefined,
    MY_COLLECTION,
  ]);
  const [myGroup] = useAgile([MY_COLLECTION.getGroupWithReference('myGroup')]);

  const [stateObject, item2, collection2] = useProxy([
    STATE_OBJECT,
    MY_COLLECTION.getItem('id2'),
    MY_COLLECTION,
  ]);

  console.log('Item1: ', item2?.name);
  console.log('Collection: ', collection2.slice(0, 2));

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

  const CountupView = () => {
    const countup = useAgile(COUNTUP);
    rerenderCountInCountupView++;
    return (
      <div style={{ backgroundColor: 'white', padding: 10 }}>
        <p style={{ color: 'black' }}>Countup: {countup}</p>
        <p style={{ color: 'black' }}>
          Rerender Count of count up View: {rerenderCountInCountupView}
        </p>
      </div>
    );
  };

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
          <h3 className={'Title'}>My State Object</h3>
          <p>
            Deep Name: {stateObject.friends.hans.name} {stateObject.location}
          </p>
          <button
            onClick={() => {
              STATE_OBJECT.patch({ friends: { hans: { name: generateId() } } });
            }}>
            Change deep name
          </button>
          <button
            onClick={() => {
              STATE_OBJECT.patch({ name: generateId() });
            }}>
            Change shallow name
          </button>
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
        <p>Rerender Count: {rerenderCount}</p>
        <CountupView />
      </header>
    </div>
  );
};

export default App;
