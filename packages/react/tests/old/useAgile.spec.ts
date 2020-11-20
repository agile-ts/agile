// THIS ARE ONLY TYPE TESTS

/* NOTE: Has to be out commented because React Hooks in not React Components are not possible!
import { Agile } from "@agile-ts/core";
import { useAgile } from "../src";

const App = new Agile();

const MY_NUMBER_STATE = App.State<number>(1);
const MY_STRING_STATE = App.State<string>("test");
const MY_STRING_COMPUTED = App.Computed<string>(
  () => MY_STRING_STATE.value + " " + MY_NUMBER_STATE.value
);
const MY_COLLECTION = App.Collection<{ id: string; name: "Test" }>();
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
  MY_COLLECTION,
  MY_COLLECTION.getGroup("test"),
  MY_NUMBER_STATE,
]);

const myStringState2 = useAgile(MY_STRING_STATE);
const [myGroup2, myStringState3, myCollection2] = useAgile([
  MY_COLLECTION.getGroup("test"),
  MY_STRING_STATE,
  MY_COLLECTION,
]);
 */
