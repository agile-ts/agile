import {
  Agile,
  CollectionPersistent,
  Collection,
  Storage,
  Persistent,
  StatePersistent,
  Group,
  Item,
} from '../../../src';
import mockConsole from 'jest-mock-console';

describe('CollectionPersistent Tests', () => {
  interface ItemInterface {
    id: string;
    name: string;
  }

  let dummyAgile: Agile;
  let dummyCollection: Collection<ItemInterface>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole(['error', 'warn']);

    dummyAgile = new Agile({ localStorage: false });
    dummyCollection = new Collection<ItemInterface>(dummyAgile, {
      key: 'dummyCollectionKey',
    });

    jest.spyOn(CollectionPersistent.prototype, 'instantiatePersistent');
    jest.spyOn(CollectionPersistent.prototype, 'initialLoading');
  });

  it("should create CollectionPersistent and shouldn't call initialLoading if Persistent isn't ready (default config)", () => {
    // Overwrite instantiatePersistent once to not call it and set ready property
    jest
      .spyOn(CollectionPersistent.prototype, 'instantiatePersistent')
      .mockImplementationOnce(function () {
        // @ts-ignore
        this.ready = false;
      });

    const collectionPersistent = new CollectionPersistent(dummyCollection);

    expect(collectionPersistent).toBeInstanceOf(CollectionPersistent);
    expect(collectionPersistent.collection()).toBe(dummyCollection);
    expect(collectionPersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: undefined,
      storageKeys: [],
      defaultStorageKey: null,
    });
    expect(collectionPersistent.initialLoading).not.toHaveBeenCalled();

    expect(collectionPersistent._key).toBe(CollectionPersistent.placeHolderKey);
    expect(collectionPersistent.ready).toBeFalsy();
    expect(collectionPersistent.isPersisted).toBeFalsy();
    expect(collectionPersistent.onLoad).toBeUndefined();
    expect(collectionPersistent.storageKeys).toStrictEqual([]);
    expect(collectionPersistent.config).toStrictEqual({
      defaultStorageKey: null,
    });
  });

  it("should create CollectionPersistent and shouldn't call initialLoading if Persistent isn't ready (specific config)", () => {
    // Overwrite instantiatePersistent once to not call it and set ready property
    jest
      .spyOn(CollectionPersistent.prototype, 'instantiatePersistent')
      .mockImplementationOnce(function () {
        // @ts-ignore
        this.ready = false;
      });

    const collectionPersistent = new CollectionPersistent(dummyCollection, {
      key: 'collectionPersistentKey',
      storageKeys: ['test1', 'test2'],
      defaultStorageKey: 'test2',
    });

    expect(collectionPersistent).toBeInstanceOf(CollectionPersistent);
    expect(collectionPersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: 'collectionPersistentKey',
      storageKeys: ['test1', 'test2'],
      defaultStorageKey: 'test2',
    });
    expect(collectionPersistent.initialLoading).not.toHaveBeenCalled();

    expect(collectionPersistent._key).toBe(CollectionPersistent.placeHolderKey);
    expect(collectionPersistent.ready).toBeFalsy();
    expect(collectionPersistent.isPersisted).toBeFalsy();
    expect(collectionPersistent.onLoad).toBeUndefined();
    expect(collectionPersistent.storageKeys).toStrictEqual([]);
    expect(collectionPersistent.config).toStrictEqual({
      defaultStorageKey: null, // gets set in 'instantiatePersistent' which is mocked
    });
  });

  it('should create CollectionPersistent and should call initialLoading if Persistent is ready (default config)', () => {
    // Overwrite instantiatePersistent once to not call it
    jest
      .spyOn(CollectionPersistent.prototype, 'instantiatePersistent')
      .mockImplementationOnce(function () {
        // @ts-ignore
        this.ready = true;
      });

    const collectionPersistent = new CollectionPersistent(dummyCollection);

    expect(collectionPersistent.initialLoading).toHaveBeenCalled();
  });

  it("should create CollectionPersistent and shouldn't call initialLoading if Persistent is ready (config.instantiate = false)", () => {
    // Overwrite instantiatePersistent once to not call it and set ready property
    jest
      .spyOn(CollectionPersistent.prototype, 'instantiatePersistent')
      .mockImplementationOnce(function () {
        // @ts-ignore
        this.ready = true;
      });

    const collectionPersistent = new CollectionPersistent(dummyCollection, {
      instantiate: false,
    });

    expect(collectionPersistent.initialLoading).not.toHaveBeenCalled();
  });

  describe('CollectionPersistent Function Tests', () => {
    let collectionPersistent: CollectionPersistent;
    let dummyItem1: Item<ItemInterface>;
    let dummyItem2: Item<ItemInterface>;
    let dummyItem3: Item<ItemInterface>;
    let dummyItem4WithoutPersistent: Item<ItemInterface>;

    beforeEach(() => {
      collectionPersistent = new CollectionPersistent(dummyCollection, {
        key: 'collectionPersistentKey',
        storageKeys: ['dummyStorage'],
      });
      dummyAgile.registerStorage(
        new Storage({
          key: 'dummyStorage',
          methods: {
            get: jest.fn(),
            remove: jest.fn(),
            set: jest.fn(),
          },
        })
      );
      dummyItem1 = new Item<ItemInterface>(dummyCollection, {
        id: '1',
        name: 'frank',
      });
      dummyItem1.persistent = new StatePersistent(dummyItem1);

      dummyItem2 = new Item<ItemInterface>(dummyCollection, {
        id: '2',
        name: 'dieter',
      });
      dummyItem2.persistent = new StatePersistent(dummyItem2);

      dummyItem3 = new Item<ItemInterface>(dummyCollection, {
        id: '3',
        name: 'hans',
      });
      dummyItem3.persistent = new StatePersistent(dummyItem3);

      dummyItem4WithoutPersistent = new Item<ItemInterface>(dummyCollection, {
        id: '4',
        name: 'jeff',
      });
    });

    describe('setKey function tests', () => {
      beforeEach(() => {
        collectionPersistent.removePersistedValue = jest.fn();
        collectionPersistent.persistValue = jest.fn();
        collectionPersistent.initialLoading = jest.fn();
        jest.spyOn(collectionPersistent, 'validatePersistent');
      });

      it('should update key with valid key in ready Persistent', async () => {
        collectionPersistent.ready = true;
        collectionPersistent._key = 'dummyKey';

        await collectionPersistent.setKey('newKey');

        expect(collectionPersistent._key).toBe('newKey');
        expect(collectionPersistent.ready).toBeTruthy();
        expect(collectionPersistent.validatePersistent).toHaveBeenCalled();
        expect(collectionPersistent.initialLoading).not.toHaveBeenCalled();
        expect(collectionPersistent.persistValue).toHaveBeenCalledWith(
          'newKey'
        );
        expect(collectionPersistent.removePersistedValue).toHaveBeenCalledWith(
          'dummyKey'
        );
      });

      it('should update key with not valid key in ready Persistent', async () => {
        collectionPersistent.ready = true;
        collectionPersistent._key = 'dummyKey';

        await collectionPersistent.setKey();

        expect(collectionPersistent._key).toBe(
          CollectionPersistent.placeHolderKey
        );
        expect(collectionPersistent.ready).toBeFalsy();
        expect(collectionPersistent.validatePersistent).toHaveBeenCalled();
        expect(collectionPersistent.initialLoading).not.toHaveBeenCalled();
        expect(collectionPersistent.persistValue).not.toHaveBeenCalled();
        expect(collectionPersistent.removePersistedValue).toHaveBeenCalledWith(
          'dummyKey'
        );
      });

      it('should update key with valid key in not ready Persistent', async () => {
        collectionPersistent.ready = false;

        await collectionPersistent.setKey('newKey');

        expect(collectionPersistent._key).toBe('newKey');
        expect(collectionPersistent.ready).toBeTruthy();
        expect(collectionPersistent.validatePersistent).toHaveBeenCalled();
        expect(collectionPersistent.initialLoading).toHaveBeenCalled();
        expect(collectionPersistent.persistValue).not.toHaveBeenCalled();
        expect(
          collectionPersistent.removePersistedValue
        ).not.toHaveBeenCalled();
      });

      it('should update key with not valid key in not ready Persistent', async () => {
        collectionPersistent.ready = false;

        await collectionPersistent.setKey();

        expect(collectionPersistent._key).toBe(
          CollectionPersistent.placeHolderKey
        );
        expect(collectionPersistent.ready).toBeFalsy();
        expect(collectionPersistent.validatePersistent).toHaveBeenCalled();
        expect(collectionPersistent.initialLoading).not.toHaveBeenCalled();
        expect(collectionPersistent.persistValue).not.toHaveBeenCalled();
        expect(
          collectionPersistent.removePersistedValue
        ).not.toHaveBeenCalled();
      });
    });

    describe('initialLoading function tests', () => {
      beforeEach(() => {
        jest.spyOn(Persistent.prototype, 'initialLoading');
      });

      it('should initialLoad and set isPersisted in Collection to true', async () => {
        await collectionPersistent.initialLoading();

        expect(Persistent.prototype.initialLoading).toHaveBeenCalled();
        expect(dummyCollection.isPersisted).toBeTruthy();
      });
    });

    describe('loadPersistedValue function tests', () => {
      let dummyDefaultGroup: Group<ItemInterface>;

      beforeEach(() => {
        collectionPersistent.config.defaultStorageKey = 'test';

        dummyDefaultGroup = new Group(dummyCollection, ['1', '2', '3']);
        dummyDefaultGroup.persistent = new StatePersistent(dummyDefaultGroup);
        if (dummyDefaultGroup.persistent)
          dummyDefaultGroup.persistent.ready = true;

        collectionPersistent.persistValue = jest.fn();

        dummyDefaultGroup.persist = jest.fn();
        if (dummyDefaultGroup.persistent)
          dummyDefaultGroup.persistent.initialLoading = jest.fn();

        dummyCollection.collect = jest.fn();
      });

      it('should load default Group and its Items with the persistentKey and apply it to the Collection if loading was successful', async () => {
        collectionPersistent.ready = true;
        dummyAgile.storages.get = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(true))
          .mockReturnValueOnce({ id: '1', name: 'hans' })
          .mockReturnValueOnce(undefined)
          .mockReturnValueOnce({ id: '3', name: 'frank' });
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.loadPersistedValue();

        expect(response).toBeTruthy();

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );

        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          collectionPersistent._key,
          collectionPersistent.config.defaultStorageKey
        );
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            '1',
            collectionPersistent._key
          ),
          collectionPersistent.config.defaultStorageKey
        );
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            '2',
            collectionPersistent._key
          ),
          collectionPersistent.config.defaultStorageKey
        );
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            '3',
            collectionPersistent._key
          ),
          collectionPersistent.config.defaultStorageKey
        );

        expect(dummyDefaultGroup.persist).toHaveBeenCalledWith({
          instantiate: false,
          followCollectionPersistKeyPattern: true,
        });
        expect(dummyDefaultGroup.persistent?.initialLoading).toHaveBeenCalled();
        expect(dummyDefaultGroup.isPersisted).toBeTruthy();

        expect(dummyCollection.collect).toHaveBeenCalledWith({
          id: '1',
          name: 'hans',
        });
        expect(dummyCollection.collect).not.toHaveBeenCalledWith(undefined);
        expect(dummyCollection.collect).toHaveBeenCalledWith({
          id: '3',
          name: 'frank',
        });

        expect(collectionPersistent.persistValue).toHaveBeenCalledWith(
          collectionPersistent._key
        );
      });

      it("shouldn't load default Group and its Items with the persistentKey and shouldn't apply it to the Collection if loading wasn't successful", async () => {
        collectionPersistent.ready = true;
        dummyAgile.storages.get = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(undefined));
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.loadPersistedValue();

        expect(response).toBeFalsy();

        expect(dummyCollection.getGroup).not.toHaveBeenCalled();

        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          collectionPersistent._key,
          collectionPersistent.config.defaultStorageKey
        );
        expect(dummyAgile.storages.get).not.toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            '1',
            collectionPersistent._key
          ),
          collectionPersistent.config.defaultStorageKey
        );
        expect(dummyAgile.storages.get).not.toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            '2',
            collectionPersistent._key
          ),
          collectionPersistent.config.defaultStorageKey
        );
        expect(dummyAgile.storages.get).not.toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            '3',
            collectionPersistent._key
          ),
          collectionPersistent.config.defaultStorageKey
        );

        expect(dummyDefaultGroup.persist).not.toHaveBeenCalled();
        expect(
          dummyDefaultGroup.persistent?.initialLoading
        ).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.isPersisted).toBeFalsy();

        expect(dummyCollection.collect).not.toHaveBeenCalled();

        expect(collectionPersistent.persistValue).not.toHaveBeenCalled();
      });

      it('should load default Group and its Items with a specific Key and should apply it to the Collection if loading was successful', async () => {
        collectionPersistent.ready = true;
        dummyAgile.storages.get = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(true))
          .mockReturnValueOnce({ id: '1', name: 'hans' })
          .mockReturnValueOnce(undefined)
          .mockReturnValueOnce({ id: '3', name: 'frank' });
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.loadPersistedValue(
          'dummyKey'
        );

        expect(response).toBeTruthy();

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );

        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          'dummyKey',
          collectionPersistent.config.defaultStorageKey
        );
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey('1', 'dummyKey'),
          collectionPersistent.config.defaultStorageKey
        );
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey('2', 'dummyKey'),
          collectionPersistent.config.defaultStorageKey
        );
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey('3', 'dummyKey'),
          collectionPersistent.config.defaultStorageKey
        );

        expect(dummyDefaultGroup.persist).toHaveBeenCalledWith({
          instantiate: false,
          followCollectionPersistKeyPattern: true,
        });
        expect(dummyDefaultGroup.persistent?.initialLoading).toHaveBeenCalled();
        expect(dummyDefaultGroup.isPersisted).toBeTruthy();

        expect(dummyCollection.collect).toHaveBeenCalledWith({
          id: '1',
          name: 'hans',
        });
        expect(dummyCollection.collect).not.toHaveBeenCalledWith(undefined);
        expect(dummyCollection.collect).toHaveBeenCalledWith({
          id: '3',
          name: 'frank',
        });

        expect(collectionPersistent.persistValue).toHaveBeenCalledWith(
          'dummyKey'
        );
      });

      it("shouldn't load default Group and its Items if Persistent isn't ready", async () => {
        collectionPersistent.ready = false;
        dummyAgile.storages.get = jest.fn(() =>
          Promise.resolve(undefined as any)
        );
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.loadPersistedValue();

        expect(response).toBeFalsy();

        expect(dummyCollection.getGroup).not.toHaveBeenCalled();

        expect(dummyAgile.storages.get).not.toHaveBeenCalled();

        expect(dummyDefaultGroup.persist).not.toHaveBeenCalled();
        expect(
          dummyDefaultGroup.persistent?.initialLoading
        ).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.isPersisted).toBeFalsy();

        expect(dummyCollection.collect).not.toHaveBeenCalled();

        expect(collectionPersistent.persistValue).not.toHaveBeenCalled();
      });

      it("shouldn't load default Group and its Items if Collection has no defaultGroup", async () => {
        collectionPersistent.ready = true;
        dummyCollection.groups = {};
        dummyAgile.storages.get = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(true));
        dummyCollection.getGroup = jest.fn(() => undefined);

        const response = await collectionPersistent.loadPersistedValue();

        expect(response).toBeFalsy();

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );

        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          collectionPersistent._key,
          collectionPersistent.config.defaultStorageKey
        );
        expect(dummyAgile.storages.get).not.toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            '1',
            collectionPersistent._key
          ),
          collectionPersistent.config.defaultStorageKey
        );
        expect(dummyAgile.storages.get).not.toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            '2',
            collectionPersistent._key
          ),
          collectionPersistent.config.defaultStorageKey
        );
        expect(dummyAgile.storages.get).not.toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            '3',
            collectionPersistent._key
          ),
          collectionPersistent.config.defaultStorageKey
        );

        expect(dummyDefaultGroup.persist).not.toHaveBeenCalled();
        expect(
          dummyDefaultGroup.persistent?.initialLoading
        ).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.isPersisted).toBeFalsy();

        expect(dummyCollection.collect).not.toHaveBeenCalled();

        expect(collectionPersistent.persistValue).not.toHaveBeenCalled();
      });
    });

    describe('persistValue function tests', () => {
      let dummyDefaultGroup: Group<ItemInterface>;

      beforeEach(() => {
        collectionPersistent.storageKeys = ['test1', 'test2'];
        collectionPersistent.isPersisted = undefined as any;

        dummyDefaultGroup = new Group(dummyCollection, ['1', '2', '3']);
        dummyCollection.data = {
          ['1']: dummyItem1,
          ['3']: dummyItem3,
        };

        dummyDefaultGroup.persist = jest.fn();
        jest.spyOn(dummyDefaultGroup, 'addSideEffect');

        dummyItem1.persist = jest.fn();
        dummyItem3.persist = jest.fn();

        dummyCollection.collect = jest.fn();

        dummyAgile.storages.set = jest.fn();
      });

      it('should persist defaultGroup and its Items with persistentKey', async () => {
        collectionPersistent.ready = true;
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.persistValue();

        expect(response).toBeTruthy();

        expect(dummyAgile.storages.set).toHaveBeenCalledWith(
          collectionPersistent._key,
          true,
          collectionPersistent.storageKeys
        );

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );
        expect(dummyDefaultGroup.persist).toHaveBeenCalledWith({
          followCollectionPersistKeyPattern: true,
        });
        expect(
          dummyDefaultGroup.addSideEffect
        ).toHaveBeenCalledWith(
          CollectionPersistent.defaultGroupSideEffectKey,
          expect.any(Function),
          { weight: 0 }
        );

        expect(dummyItem1.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            dummyItem1._key,
            collectionPersistent._key
          )
        );
        expect(dummyItem3.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            dummyItem3._key,
            collectionPersistent._key
          )
        );

        expect(collectionPersistent.isPersisted).toBeTruthy();
      });

      it('should persist defaultGroup and its Items with specific Key', async () => {
        collectionPersistent.ready = true;
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.persistValue('dummyKey');

        expect(response).toBeTruthy();

        expect(dummyAgile.storages.set).toHaveBeenCalledWith(
          'dummyKey',
          true,
          collectionPersistent.storageKeys
        );

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );
        expect(dummyDefaultGroup.persist).toHaveBeenCalledWith({
          followCollectionPersistKeyPattern: true,
        });
        expect(
          dummyDefaultGroup.addSideEffect
        ).toHaveBeenCalledWith(
          CollectionPersistent.defaultGroupSideEffectKey,
          expect.any(Function),
          { weight: 0 }
        );

        expect(dummyItem1.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(dummyItem1._key, 'dummyKey')
        );
        expect(dummyItem3.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(dummyItem3._key, 'dummyKey')
        );

        expect(collectionPersistent.isPersisted).toBeTruthy();
      });

      it("shouldn't persist defaultGroup and its Items if Persistent isn't ready", async () => {
        collectionPersistent.ready = false;
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.persistValue('dummyKey');

        expect(response).toBeFalsy();

        expect(dummyAgile.storages.set).not.toHaveBeenCalled();

        expect(dummyCollection.getGroup).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.persist).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.addSideEffect).not.toHaveBeenCalled();

        expect(dummyItem1.persist).not.toHaveBeenCalled();
        expect(dummyItem3.persist).not.toHaveBeenCalled();

        expect(collectionPersistent.isPersisted).toBeUndefined();
      });

      it("shouldn't persist defaultGroup and its Items if Collection has no defaultGroup", async () => {
        collectionPersistent.ready = true;
        dummyCollection.getGroup = jest.fn(() => undefined as any);

        const response = await collectionPersistent.persistValue();

        expect(response).toBeFalsy();

        expect(dummyAgile.storages.set).not.toHaveBeenCalled();

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );
        expect(dummyDefaultGroup.persist).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.addSideEffect).not.toHaveBeenCalled();

        expect(dummyItem1.persist).not.toHaveBeenCalled();
        expect(dummyItem3.persist).not.toHaveBeenCalled();

        expect(collectionPersistent.isPersisted).toBeUndefined();
      });

      describe('test added sideEffect called CollectionPersistent.defaultGroupSideEffectKey', () => {
        beforeEach(() => {
          collectionPersistent.rebuildStorageSideEffect = jest.fn();
        });

        it('should call rebuildStorageSideEffect with persistentKey', async () => {
          collectionPersistent.ready = true;
          dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

          await collectionPersistent.persistValue();

          dummyDefaultGroup.sideEffects[
            CollectionPersistent.defaultGroupSideEffectKey
          ].callback(dummyDefaultGroup);

          expect(
            collectionPersistent.rebuildStorageSideEffect
          ).toHaveBeenCalledWith(dummyDefaultGroup, collectionPersistent._key);
        });

        it('should call rebuildStorageSideEffect with specific Key', async () => {
          collectionPersistent.ready = true;
          dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

          await collectionPersistent.persistValue('dummyKey');

          dummyDefaultGroup.sideEffects[
            CollectionPersistent.defaultGroupSideEffectKey
          ].callback(dummyDefaultGroup);

          expect(
            collectionPersistent.rebuildStorageSideEffect
          ).toHaveBeenCalledWith(dummyDefaultGroup, 'dummyKey');
        });
      });
    });

    describe('removePersistedValue function tests', () => {
      let dummyDefaultGroup: Group<ItemInterface>;

      beforeEach(() => {
        collectionPersistent.storageKeys = ['test1', 'test2'];
        collectionPersistent.isPersisted = undefined as any;

        dummyDefaultGroup = new Group(dummyCollection, ['1', '2', '3']);
        dummyDefaultGroup.persistent = new StatePersistent(dummyDefaultGroup);
        dummyCollection.data = {
          ['1']: dummyItem1,
          ['3']: dummyItem3,
        };

        if (dummyDefaultGroup.persistent)
          dummyDefaultGroup.persistent.removePersistedValue = jest.fn();
        dummyDefaultGroup.removeSideEffect = jest.fn();

        if (dummyItem1.persistent)
          dummyItem1.persistent.removePersistedValue = jest.fn();
        if (dummyItem3.persistent)
          dummyItem3.persistent.removePersistedValue = jest.fn();

        dummyAgile.storages.remove = jest.fn();
      });

      it('should remove persisted defaultGroup and its Items from Storage with persistentKey', async () => {
        collectionPersistent.ready = true;
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.removePersistedValue();

        expect(response).toBeTruthy();

        expect(dummyAgile.storages.remove).toHaveBeenCalledWith(
          collectionPersistent._key,
          collectionPersistent.storageKeys
        );

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );
        expect(
          dummyDefaultGroup.persistent?.removePersistedValue
        ).toHaveBeenCalled();
        expect(dummyDefaultGroup.removeSideEffect).toHaveBeenCalledWith(
          CollectionPersistent.defaultGroupSideEffectKey
        );

        expect(dummyItem1.persistent?.removePersistedValue).toHaveBeenCalled();
        expect(dummyItem3.persistent?.removePersistedValue).toHaveBeenCalled();

        expect(collectionPersistent.isPersisted).toBeFalsy();
      });

      it('should remove persisted defaultGroup and its Items from Storage with specific Key', async () => {
        collectionPersistent.ready = true;
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.removePersistedValue(
          'dummyKey'
        );

        expect(response).toBeTruthy();

        expect(dummyAgile.storages.remove).toHaveBeenCalledWith(
          'dummyKey',
          collectionPersistent.storageKeys
        );

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );
        expect(
          dummyDefaultGroup.persistent?.removePersistedValue
        ).toHaveBeenCalled();
        expect(dummyDefaultGroup.removeSideEffect).toHaveBeenCalledWith(
          CollectionPersistent.defaultGroupSideEffectKey
        );

        expect(dummyItem1.persistent?.removePersistedValue).toHaveBeenCalled();
        expect(dummyItem3.persistent?.removePersistedValue).toHaveBeenCalled();

        expect(collectionPersistent.isPersisted).toBeFalsy();
      });

      it("shouldn't remove persisted defaultGroup and its Items from Storage if Persistent isn't ready", async () => {
        collectionPersistent.ready = false;
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.removePersistedValue();

        expect(response).toBeFalsy();

        expect(dummyAgile.storages.remove).not.toHaveBeenCalled();

        expect(dummyCollection.getGroup).not.toHaveBeenCalled();
        expect(
          dummyDefaultGroup.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.removeSideEffect).not.toHaveBeenCalled();

        expect(
          dummyItem1.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();
        expect(
          dummyItem3.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();

        expect(collectionPersistent.isPersisted).toBeUndefined();
      });

      it("shouldn't remove persisted defaultGroup and its Items from Storage if Collection has no default Group", async () => {
        collectionPersistent.ready = true;
        dummyCollection.getGroup = jest.fn(() => undefined as any);

        const response = await collectionPersistent.removePersistedValue();

        expect(response).toBeFalsy();

        expect(dummyAgile.storages.remove).not.toHaveBeenCalled();

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );
        expect(
          dummyDefaultGroup.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.removeSideEffect).not.toHaveBeenCalled();

        expect(
          dummyItem1.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();
        expect(
          dummyItem3.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();

        expect(collectionPersistent.isPersisted).toBeUndefined();
      });
    });

    describe('formatKey function tests', () => {
      it('should return key of Collection if no key got passed', () => {
        dummyCollection._key = 'coolKey';

        const response = collectionPersistent.formatKey();

        expect(response).toBe('coolKey');
      });

      it('should return passed key', () => {
        dummyCollection._key = 'coolKey';

        const response = collectionPersistent.formatKey('awesomeKey');

        expect(response).toBe('awesomeKey');
      });

      it('should return and apply passed key to Collection if Collection had no own key before', () => {
        dummyCollection._key = undefined;

        const response = collectionPersistent.formatKey('awesomeKey');

        expect(response).toBe('awesomeKey');
        expect(dummyCollection._key).toBe('awesomeKey');
      });

      it('should return undefined if no key got passed and Collection has no key', () => {
        dummyCollection._key = undefined;

        const response = collectionPersistent.formatKey();

        expect(response).toBeUndefined();
      });
    });

    describe('rebuildStorageSideEffects function tests', () => {
      let dummyGroup: Group<ItemInterface>;

      beforeEach(() => {
        dummyGroup = new Group(dummyCollection);
        dummyCollection.data = {
          ['1']: dummyItem1,
          ['2']: dummyItem2,
          ['3']: dummyItem3,
          ['4']: dummyItem4WithoutPersistent,
        };
        dummyCollection.persistent = collectionPersistent;

        dummyItem1.persist = jest.fn();
        dummyItem2.persist = jest.fn();
        dummyItem3.persist = jest.fn();
        dummyItem4WithoutPersistent.persist = jest.fn();

        if (dummyItem1.persistent)
          dummyItem1.persistent.removePersistedValue = jest.fn();
        if (dummyItem2.persistent)
          dummyItem2.persistent.removePersistedValue = jest.fn();
        if (dummyItem3.persistent)
          dummyItem3.persistent.removePersistedValue = jest.fn();

        if (dummyItem1.persistent)
          dummyItem1.persistent.persistValue = jest.fn();
        if (dummyItem2.persistent)
          dummyItem2.persistent.persistValue = jest.fn();
        if (dummyItem3.persistent)
          dummyItem3.persistent.persistValue = jest.fn();
      });

      it('should return if no Item got added or removed', () => {
        dummyGroup.previousStateValue = ['1', '2', '3'];
        dummyGroup._value = ['1', '2', '3'];

        collectionPersistent.rebuildStorageSideEffect(dummyGroup);

        expect(dummyItem1.persist).not.toHaveBeenCalled();
        expect(dummyItem2.persist).not.toHaveBeenCalled();
        expect(dummyItem3.persist).not.toHaveBeenCalled();
        expect(dummyItem4WithoutPersistent.persist).not.toHaveBeenCalled();

        expect(
          dummyItem1.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();
        expect(
          dummyItem2.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();
        expect(
          dummyItem3.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();

        expect(dummyItem1.persistent?.persistValue).not.toHaveBeenCalled();
        expect(dummyItem2.persistent?.persistValue).not.toHaveBeenCalled();
        expect(dummyItem3.persistent?.persistValue).not.toHaveBeenCalled();
      });

      it('should call removePersistedValue on Items that got removed from Group', () => {
        dummyGroup.previousStateValue = ['1', '2', '3'];
        dummyGroup._value = ['2'];

        collectionPersistent.rebuildStorageSideEffect(dummyGroup);

        expect(dummyItem1.persist).not.toHaveBeenCalled();
        expect(dummyItem2.persist).not.toHaveBeenCalled();
        expect(dummyItem3.persist).not.toHaveBeenCalled();
        expect(dummyItem4WithoutPersistent.persist).not.toHaveBeenCalled();

        expect(
          dummyItem1.persistent?.removePersistedValue
        ).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey('1', collectionPersistent._key)
        );
        expect(
          dummyItem2.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();
        expect(
          dummyItem3.persistent?.removePersistedValue
        ).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey('3', collectionPersistent._key)
        );

        expect(dummyItem1.persistent?.persistValue).not.toHaveBeenCalled();
        expect(dummyItem2.persistent?.persistValue).not.toHaveBeenCalled();
        expect(dummyItem3.persistent?.persistValue).not.toHaveBeenCalled();
      });

      it('should call persistValue on Items that have a persistent and got added to Group', () => {
        dummyGroup.previousStateValue = ['1'];
        dummyGroup._value = ['1', '2', '3'];

        collectionPersistent.rebuildStorageSideEffect(dummyGroup);

        expect(dummyItem1.persist).not.toHaveBeenCalled();
        expect(dummyItem2.persist).not.toHaveBeenCalled();
        expect(dummyItem3.persist).not.toHaveBeenCalled();
        expect(dummyItem4WithoutPersistent.persist).not.toHaveBeenCalled();

        expect(
          dummyItem1.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();
        expect(
          dummyItem2.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();
        expect(
          dummyItem3.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();

        expect(dummyItem1.persistent?.persistValue).not.toHaveBeenCalled();
        expect(dummyItem2.persistent?.persistValue).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey('2', collectionPersistent._key)
        );
        expect(dummyItem3.persistent?.persistValue).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey('3', collectionPersistent._key)
        );
      });

      it('should call persist on Items that have no persistent and got added to Group', () => {
        dummyGroup.previousStateValue = ['1'];
        dummyGroup._value = ['1', '4'];

        collectionPersistent.rebuildStorageSideEffect(dummyGroup);

        expect(dummyItem1.persist).not.toHaveBeenCalled();
        expect(dummyItem2.persist).not.toHaveBeenCalled();
        expect(dummyItem3.persist).not.toHaveBeenCalled();
        expect(dummyItem4WithoutPersistent.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey('4', collectionPersistent._key)
        );

        expect(
          dummyItem1.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();
        expect(
          dummyItem2.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();
        expect(
          dummyItem3.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();

        expect(dummyItem1.persistent?.persistValue).not.toHaveBeenCalled();
        expect(dummyItem2.persistent?.persistValue).not.toHaveBeenCalled();
        expect(dummyItem3.persistent?.persistValue).not.toHaveBeenCalled();
      });
    });

    describe('getItemStorageKey function tests', () => {
      beforeEach(() => {
        console.warn = jest.fn();
      });

      it('should build ItemStorageKey out of itemKey and collectionKey', () => {
        const response = CollectionPersistent.getItemStorageKey(
          'itemKey',
          'collectionKey'
        );

        expect(response).toBe('_collectionKey_item_itemKey');
        expect(console.warn).not.toHaveBeenCalled();
      });

      it('should build ItemStorageKey out of collectionKey with warning', () => {
        const response = CollectionPersistent.getItemStorageKey(
          undefined,
          'collectionKey'
        );

        expect(response).toBe('_collectionKey_item_unknown');
        expect(console.warn).toHaveBeenCalledWith(
          'Agile Warn: Failed to build unique Item StorageKey!'
        );
      });

      it('should build ItemStorageKey out of itemKey with warning', () => {
        const response = CollectionPersistent.getItemStorageKey(
          'itemKey',
          undefined
        );

        expect(response).toBe('_unknown_item_itemKey');
        expect(console.warn).toHaveBeenCalledWith(
          'Agile Warn: Failed to build unique Item StorageKey!'
        );
      });

      it('should build ItemStorageKey out of nothing with warning', () => {
        const response = CollectionPersistent.getItemStorageKey(
          undefined,
          undefined
        );

        expect(response).toBe('_unknown_item_unknown');
        expect(console.warn).toHaveBeenCalledWith(
          'Agile Warn: Failed to build unique Item StorageKey!'
        );
      });
    });

    describe('getGroupStorageKey function tests', () => {
      beforeEach(() => {
        console.warn = jest.fn();
      });

      it('should build GroupStorageKey out of groupKey and collectionKey', () => {
        const response = CollectionPersistent.getGroupStorageKey(
          'groupKey',
          'collectionKey'
        );

        expect(response).toBe('_collectionKey_group_groupKey');
        expect(console.warn).not.toHaveBeenCalled();
      });

      it('should build GroupStorageKey out of collectionKey with warning', () => {
        const response = CollectionPersistent.getGroupStorageKey(
          undefined,
          'collectionKey'
        );

        expect(response).toBe('_collectionKey_group_unknown');
        expect(console.warn).toHaveBeenCalledWith(
          'Agile Warn: Failed to build unique Group StorageKey!'
        );
      });

      it('should build GroupStorageKey out of groupKey with warning', () => {
        const response = CollectionPersistent.getGroupStorageKey(
          'groupKey',
          undefined
        );

        expect(response).toBe('_unknown_group_groupKey');
        expect(console.warn).toHaveBeenCalledWith(
          'Agile Warn: Failed to build unique Group StorageKey!'
        );
      });

      it('should build GroupStorageKey out of nothing with warning', () => {
        const response = CollectionPersistent.getGroupStorageKey(
          undefined,
          undefined
        );

        expect(response).toBe('_unknown_group_unknown');
        expect(console.warn).toHaveBeenCalledWith(
          'Agile Warn: Failed to build unique Group StorageKey!'
        );
      });
    });
  });
});
