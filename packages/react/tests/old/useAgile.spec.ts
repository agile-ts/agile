// Be aware that in the test folder other ts rules count than in the src folder
// THIS ARE ONLY TYPE TESTS
// NOTE: Has to be out commented because React Hooks in not React Components are not possible!

/*
import { Agile, Collection } from '@agile-ts/core';
import { useAgile } from './hooks/useAgile';

const App = new Agile();

const MY_NUMBER_STATE = App.createState<number>(1);
const MY_STRING_STATE = App.createState<string>('test');
const MY_STRING_COMPUTED = App.createComputed<string>(
  () => MY_STRING_STATE.value + ' ' + MY_NUMBER_STATE.value
);
const MY_COLLECTION = App.createCollection<{ id: string; name: 'Test' }>();
const MY_SELECTOR = MY_COLLECTION.getSelector(1);

const [
  myStringState,
  mySelector,
  myNumberState,
  myStringComputed,
  myCollection,
  myGroup,
  myNumberState2,
] = useAgile([
  MY_STRING_STATE,
  MY_SELECTOR,
  MY_NUMBER_STATE,
  MY_STRING_COMPUTED,
  MY_COLLECTION as any,
  MY_COLLECTION.getGroup('test'),
  MY_NUMBER_STATE,
]);

const myStringState2 = useAgile(MY_STRING_STATE);
const [myGroup2, myStringState3, myCollection2] = useAgile([
  MY_COLLECTION.getGroup('test'),
  MY_STRING_STATE,
  MY_COLLECTION as any,
]);

const myState10 = useAgile(MY_NUMBER_STATE);
const myCollection10 = useAgile(MY_COLLECTION);
const myCollection11 = useAgile(
  new Collection<{ id: number; name: string }>(App)
);
 */
