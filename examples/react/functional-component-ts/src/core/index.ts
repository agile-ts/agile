import { Agile, clone, Logger } from '@agile-ts/core';
import API from '@agile-ts/api';
import Event from '@agile-ts/event';

export const myStorage: any = {};

export const App = new Agile({
  logConfig: { level: Logger.level.DEBUG },
  localStorage: true,
});

// Register custom second Storage
App.registerStorage(
  App.createStorage({
    key: 'myStorage',
    methods: {
      get: (key: string) => {
        console.log(`GET '${key}'`);
        return myStorage[key];
      },
      set: (key: string, value: any) => {
        console.log(`SET '${key}'`, value);
        myStorage[key] = value;
      },
      remove: (key: string) => {
        console.log(`DELETE '${key}'`);
        delete myStorage[key];
      },
    },
  })
);

export const COUNTUP = App.createState(1).interval((value) => value + 1, 1000);
export const MY_STATE = App.createState<string>('MyState', { key: 'my-state' }); //.persist();
export const MY_STATE_2 = App.createState<string>('MyState2', {
  key: 'my-state2',
}).persist({
  storageKeys: ['myStorage', 'localStorage'],
  defaultStorageKey: 'localStorage', // where the persisted value gets loaded from (saved is it in all provided Storages (storageKeys))
});
MY_STATE_2.onLoad(() => {
  console.log('On Load MY_STATE_2');
});
export const MY_STATE_3 = App.createState<number>(1); //.persist("my-state2");

MY_STATE.watch('test', (value: any) => {
  console.log('Watch ' + value);
});

export const MY_COMPUTED = App.createComputed<string>(() => {
  return 'test' + MY_STATE.value + '_computed_' + MY_STATE_2.value;
}, []).setKey('myComputed');

interface collectionValueInterface {
  id: string;
  name: string;
}

export const MY_COLLECTION = App.createCollection<collectionValueInterface>(
  (collection) => ({
    key: 'my-collection',
    groups: {
      myGroup: collection.Group(['id4']),
    },
    selectors: {
      mySelector: collection.Selector('id3'),
    },
    initialData: [{ id: 'id4', name: 'hans' }],
  })
).persist();
MY_COLLECTION.collect({ id: 'id1', name: 'test' });
MY_COLLECTION.collect({ id: 'id2', name: 'test2' }, 'myGroup');
MY_COLLECTION.update('id1', { id: 'id1Updated', name: 'testUpdated' });
MY_COLLECTION.getGroup('myGroup')?.persist({
  followCollectionPersistKeyPattern: true,
});
MY_COLLECTION.onLoad(() => {
  console.log('On Load MY_COLLECTION');
});

console.log('Initial: myCollection ', clone(MY_COLLECTION));

export const MY_EVENT = new Event<{ name: string }>(App, {
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

const logger = new Logger((l) => ({
  prefix: 'Tests',
  allowedTags: ['coreWarning', 'randomDebug'],
  level: Logger.level.DEBUG,
  timestamp: true,
}));
logger.watch({
  callback: (loggerCategory, data) => {
    console.log('--- CALLED WATCHER ', loggerCategory, data);
  },
  level: Logger.level.WARN,
});
logger.createLoggerCategory({
  key: 'coreLog',
  level: 100,
  customStyle: 'color: purple; font-weight: bold;',
  prefix: 'Core Log',
});
logger.custom('coreLog', 'This is a cool Log', { object: 'yeet' });
logger.log('This is a Log');
logger.debug('This is a Debug');
logger.info('This is an Info');
logger.info('This is an Info with Object', { empty: 'object' });
logger.error('This is an Error');
logger.warn('This is a Warning');
logger.trace('This is a Trace');
logger.if.tag(['coreWarning']).warn('My core Warning');
logger.if.tag(['randomDebug']).debug('My random Debug');
logger.table('Test Table', { test: 'test', test1: 'test1' });

const api = new API({
  timeout: 10000,
  options: {
    credentials: undefined,
  },
});

// testing some urls
api
  .with({
    baseURL: `https://api.npmjs.org/downloads/point/2020-08-24:2020-09-24/@agile-ts/core`,
  })
  .get('');

// testing some urls
api
  .with({
    baseURL: `https://api`,
  })
  .get('');
