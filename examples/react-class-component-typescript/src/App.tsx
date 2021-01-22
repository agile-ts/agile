import React from 'react';
import './App.css';
import { AgileHOC } from '@agile-ts/react';
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

class App extends React.Component<any> {
  componentDidMount() {
    globalBind('__core__', { ...require('./core') });
  }

  constructor(props: any) {
    super(props);
    this.state = {};
  }

  render() {
    // Note: Rerenders twice because of React Strickt Mode (also useState does trigger a rerender twice)
    // https://stackoverflow.com/questions/54927622/usestate-do-double-render
    rerenderCount++;

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

          <div className={'Container'}>
            <h3 className={'Title'}>My Computed</h3>
            <p>{this.props?.myComputed}</p>
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
              {this.props?.myGroup &&
                this.props?.myGroup.map((item: any) => (
                  <p key={item.id}>{item.name}</p>
                ))}
            </div>
            <button
              onClick={() =>
                MY_COLLECTION.collect({ id: 'id3', name: 'Test3' })
              }>
              Collect
            </button>
            <button
              onClick={() => MY_COLLECTION.getGroup('myGroup')?.add('id3')}>
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

          <p>MySelector: {this.props?.mySelector?.name}</p>

          <button onClick={() => MY_COLLECTION.removeSelector('mySelector')}>
            Remove mySelector
          </button>
          <p>{rerenderCount}</p>
        </header>
      </div>
    );
  }
}

// const FinalApp = AgileHOC(App, [MY_STATE, MY_STATE_2, MY_COMPUTED]);

const FinalApp = AgileHOC(App, {
  myState: MY_STATE,
  myState2: MY_STATE_2,
  item: MY_COLLECTION.getItem('1'),
  mySelector: MY_COLLECTION.getSelector('mySelector'),
  myState3: MY_STATE_3,
  myUndefined: undefined,
  myComputed: MY_COMPUTED,
  myCollection: MY_COLLECTION as any,
  myGroup: MY_COLLECTION.getGroupWithReference('myGroup'),
});

export default FinalApp;
