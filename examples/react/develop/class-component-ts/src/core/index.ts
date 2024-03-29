import {
  clone,
  createState,
  createComputed,
  createCollection,
} from '@agile-ts/core';
import { createEvent } from '@agile-ts/event';

export const MY_STATE = createState<string>('MyState'); //.persist();
export const MY_STATE_2 = createState<string>('MyState2', {
  key: 'myState2',
}).persist();
MY_STATE_2.onLoad(() => {
  console.log('On Load');
});
export const MY_STATE_3 = createState<number>(1); //.persist("my-state2");

MY_STATE.watch('test', (value: any) => {
  console.log('Watch ' + value);
});

export const MY_COMPUTED = createComputed<string>(() => {
  return 'test' + MY_STATE.value + '_computed_' + MY_STATE_2.value;
}, []).setKey('myComputed');

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

console.log('Initial: myCollection ', clone(MY_COLLECTION));

export const MY_EVENT = createEvent<{ name: string }>({
  delay: 3000,
  key: 'myEvent',
});

MY_EVENT.on(() => {
  console.log('Triggered Event (noId)');
});

MY_EVENT.on('Test', () => {
  console.log('Triggered Event (Test)');
});

// LOGGER tests

/*
const logger = new Logger((l) => ({
  prefix: "Tests",
  allowedTags: ["coreWarning", "randomDebug"],
  level: l.level.DEBUG,
}));
logger.watch({
  callback: (loggerCategory, data) => {
    console.log("--- CALLED WATCHER ", loggerCategory, data);
  },
  level: logger.level.WARN,
});
logger.createLoggerCategory({
  key: "coreLog",
  level: 100,
  customStyle: "color: purple; font-weight: bold;",
  prefix: "Core Log",
});
logger.custom("coreLog", "This is a cool Log", { object: "yeet" });
logger.log("This is a Log");
logger.debug("This is a Debug");
logger.info("This is an Info");
logger.info("This is an Info with Object", { empty: "object" });
logger.error("This is an Error");
logger.warn("This is a Warning");
logger.trace("This is a Trace");
logger.if.tag(["coreWarning"]).warn("My core Warning");
logger.if.tag(["randomDebug"]).debug("My random Debug");
logger.table("Test Table", { test: "test", test1: "test1" });


 */
