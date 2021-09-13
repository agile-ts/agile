import {
  Agile,
  Item,
  createStorage,
  createCollection,
  createStorageManager,
  assignSharedAgileStorageManager,
} from '../../src';
import { LogMock } from '../helper/logMock';

describe('Collection Persist Function Tests', () => {
  const myStorage: any = {};
  const storageMethods = {
    get: jest.fn((key) => {
      // console.log(`GET '${key}'`);
      return myStorage[key];
    }),
    set: jest.fn((key, value) => {
      // console.log(`SET '${key}'`, value);
      myStorage[key] = value;
    }),
    remove: jest.fn((key) => {
      // console.log(`DELETE '${key}'`);
      delete myStorage[key];
    }),
  };
  let App: Agile;

  interface User {
    id: number;
    name: string;
  }

  beforeEach(() => {
    LogMock.mockLogs();
    jest.clearAllMocks();

    App = new Agile();

    const storageManager = createStorageManager({ localStorage: false });
    assignSharedAgileStorageManager(storageManager);
    storageManager.register(
      createStorage({
        key: 'testStorage',
        prefix: 'test',
        methods: storageMethods,
      })
    );
  });

  describe('Collection', () => {
    it('Can persist Collection', async () => {
      // Create Collection
      const MY_COLLECTION = createCollection<User>({}, App);

      // Test Collecting Item before Persisting
      MY_COLLECTION.collect({ id: 2, name: 'hans' });
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(myStorage).toStrictEqual({});
      expect(storageMethods.set).not.toHaveBeenCalled();
      expect(storageMethods.get).not.toHaveBeenCalled();
      expect(storageMethods.remove).not.toHaveBeenCalled();

      // Test Persisting
      MY_COLLECTION.persist('myCollection');
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(myStorage).toStrictEqual({
        _test_myCollection: 'true',
        _test__myCollection_group_default: '[2]',
        _test__myCollection_item_2: '{"id":2,"name":"hans"}',
      });
      expect(storageMethods.set).toHaveBeenCalledTimes(3);
      expect(storageMethods.get).toHaveBeenCalledTimes(3);
      expect(storageMethods.remove).toHaveBeenCalledTimes(0);

      // Test collecting new Item
      MY_COLLECTION.collect({ id: 1, name: 'frank' });
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(myStorage).toStrictEqual({
        _test_myCollection: 'true',
        _test__myCollection_group_default: '[2,1]',
        _test__myCollection_item_2: '{"id":2,"name":"hans"}',
        _test__myCollection_item_1: '{"id":1,"name":"frank"}',
      });
      expect(storageMethods.set).toHaveBeenCalledTimes(5);
      expect(storageMethods.get).toHaveBeenCalledTimes(4);
      expect(storageMethods.remove).toHaveBeenCalledTimes(0);

      // Test creating Group
      MY_COLLECTION.createGroup('stupidPeople', [1, 2]).persist({
        followCollectionPersistKeyPattern: true,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(myStorage).toStrictEqual({
        _test_myCollection: 'true',
        _test__myCollection_group_stupidPeople: '[1,2]',
        _test__myCollection_group_default: '[2,1]',
        _test__myCollection_item_2: '{"id":2,"name":"hans"}',
        _test__myCollection_item_1: '{"id":1,"name":"frank"}',
      });
      expect(storageMethods.set).toHaveBeenCalledTimes(6);
      expect(storageMethods.get).toHaveBeenCalledTimes(5);
      expect(storageMethods.remove).toHaveBeenCalledTimes(0);

      // Test collecting new Item
      MY_COLLECTION.collect({ id: 3, name: 'günter' });
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(myStorage).toStrictEqual({
        _test_myCollection: 'true',
        _test__myCollection_group_stupidPeople: '[1,2]',
        _test__myCollection_group_default: '[2,1,3]',
        _test__myCollection_item_2: '{"id":2,"name":"hans"}',
        _test__myCollection_item_1: '{"id":1,"name":"frank"}',
        _test__myCollection_item_3: '{"id":3,"name":"günter"}',
      });
      expect(storageMethods.set).toHaveBeenCalledTimes(8);
      expect(storageMethods.get).toHaveBeenCalledTimes(6);
      expect(storageMethods.remove).toHaveBeenCalledTimes(0);

      // Test updating Item
      MY_COLLECTION.update(3, { name: 'Benno' });
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(myStorage).toStrictEqual({
        _test_myCollection: 'true',
        _test__myCollection_group_stupidPeople: '[1,2]',
        _test__myCollection_group_default: '[2,1,3]',
        _test__myCollection_item_2: '{"id":2,"name":"hans"}',
        _test__myCollection_item_1: '{"id":1,"name":"frank"}',
        _test__myCollection_item_3: '{"id":3,"name":"Benno"}',
      });
      expect(storageMethods.set).toHaveBeenCalledTimes(9);
      expect(storageMethods.get).toHaveBeenCalledTimes(6);
      expect(storageMethods.remove).toHaveBeenCalledTimes(0);

      // Test updating Item with ItemKey
      MY_COLLECTION.update(1, { id: 37, name: 'Arne' });
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(myStorage).toStrictEqual({
        _test_myCollection: 'true',
        _test__myCollection_group_stupidPeople: '[37,2]',
        _test__myCollection_group_default: '[2,37,3]',
        _test__myCollection_item_2: '{"id":2,"name":"hans"}',
        _test__myCollection_item_37: '{"id":37,"name":"Arne"}',
        _test__myCollection_item_3: '{"id":3,"name":"Benno"}',
      });
      expect(storageMethods.set).toHaveBeenCalledTimes(13);
      expect(storageMethods.get).toHaveBeenCalledTimes(6);
      expect(storageMethods.remove).toHaveBeenCalledTimes(1);
    });

    it('Can load persisted Collection', async () => {
      // Create Collection
      const MY_COLLECTION = createCollection<User>({}, App);

      // Load persisted Value
      MY_COLLECTION.persist('myCollection');
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(myStorage).toStrictEqual({
        _test_myCollection: 'true',
        _test__myCollection_group_stupidPeople: '[37,2]',
        _test__myCollection_group_default: '[2,37,3]',
        _test__myCollection_item_2: '{"id":2,"name":"hans"}',
        _test__myCollection_item_37: '{"id":37,"name":"Arne"}',
        _test__myCollection_item_3: '{"id":3,"name":"Benno"}',
      });
      expect(MY_COLLECTION.isPersisted).toBeTruthy();
      expect(MY_COLLECTION.size).toBe(3);
      expect(MY_COLLECTION.data['2']).toBeInstanceOf(Item);
      expect(MY_COLLECTION.data['37']).toBeInstanceOf(Item);
      expect(MY_COLLECTION.data['3']).toBeInstanceOf(Item);

      // Updating some Collection Stuff
      MY_COLLECTION.update(3, { name: 'Angela' });
      MY_COLLECTION.collect({ id: 4, name: 'Paul' });
      MY_COLLECTION.collect({ id: 99, name: 'Jeff' });
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(myStorage).toStrictEqual({
        _test_myCollection: 'true',
        _test__myCollection_group_default: '[2,37,3,4,99]',
        _test__myCollection_item_2: '{"id":2,"name":"hans"}',
        _test__myCollection_group_stupidPeople: '[37,2]',
        _test__myCollection_item_3: '{"id":3,"name":"Angela"}',
        _test__myCollection_item_37: '{"id":37,"name":"Arne"}',
        _test__myCollection_item_4: '{"id":4,"name":"Paul"}',
        _test__myCollection_item_99: '{"id":99,"name":"Jeff"}',
      });

      // Test removing Item
      MY_COLLECTION.remove(3).everywhere();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(myStorage).toStrictEqual({
        _test_myCollection: 'true',
        _test__myCollection_group_default: '[2,37,4,99]',
        _test__myCollection_item_2: '{"id":2,"name":"hans"}',
        _test__myCollection_group_stupidPeople: '[37,2]',
        _test__myCollection_item_37: '{"id":37,"name":"Arne"}',
        _test__myCollection_item_4: '{"id":4,"name":"Paul"}',
        _test__myCollection_item_99: '{"id":99,"name":"Jeff"}',
      });
    });

    it('Can remove persisted Collection', async () => {
      // Create Collection
      const MY_COLLECTION = createCollection<User>({}, App);

      // Load persisted Value
      MY_COLLECTION.persist('myCollection');
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(myStorage).toStrictEqual({
        _test_myCollection: 'true',
        _test__myCollection_group_default: '[2,37,4,99]',
        _test__myCollection_item_2: '{"id":2,"name":"hans"}',
        _test__myCollection_group_stupidPeople: '[37,2]',
        _test__myCollection_item_37: '{"id":37,"name":"Arne"}',
        _test__myCollection_item_4: '{"id":4,"name":"Paul"}',
        _test__myCollection_item_99: '{"id":99,"name":"Jeff"}',
      });

      // Test Removing Persisted Value
      MY_COLLECTION.persistent?.removePersistedValue();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(myStorage).toStrictEqual({
        _test__myCollection_group_stupidPeople: '[37,2]',
      });
    });
  });
});
