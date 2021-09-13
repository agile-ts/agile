import { createState, createComputed, createCollection } from '@agile-ts/core';
import { createEvent, Event } from '@agile-ts/event';
import { Alert } from 'react-native';

export const MY_STATE = createState<string>('MyState', { key: 'my-state' }); //.persist();
export const MY_STATE_2 = createState<string>('MyState2'); //.persist("my-state2");
export const MY_STATE_3 = createState<number>(1); //.persist("my-state2");

MY_STATE.watch('test', (value: any) => {
  console.log('Watch ' + value);
});

export const MY_COMPUTED = createComputed<string>(() => {
  return 'test' + MY_STATE.value + '_computed_' + MY_STATE_2.value;
});

interface collectionValueInterface {
  id: string;
  name: string;
}

export const MY_COLLECTION = createCollection<collectionValueInterface>(
  (collection) => ({
    key: 'my-collection',
    groups: {
      myGroup: collection.Group(),
    },
    selectors: {
      mySelector: collection.Selector('id3'),
    },
  })
).persist();
MY_COLLECTION.collect({ id: 'id1', name: 'test' });
MY_COLLECTION.collect({ id: 'id2', name: 'test2' }, 'myGroup');
MY_COLLECTION.update('id1', { id: 'id1Updated', name: 'testUpdated' });
MY_COLLECTION.getGroup('myGroup')?.persist({
  followCollectionPersistKeyPattern: true,
});

console.log('Initial: myCollection ', MY_COLLECTION);

export const MY_EVENT = createEvent<{ name: string }>();

MY_EVENT.on('Test', (payload) => {
  Alert.alert(
    'Welcome ' + payload?.name,
    'My Alert Msg',
    [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      { text: 'OK', onPress: () => console.log('OK Pressed') },
    ],
    { cancelable: false }
  );
});
