import {
  Agile,
  State,
  StatePersistent,
  Storage,
  Persistent,
} from '../../../src';

describe('StatePersistent Tests', () => {
  let dummyAgile: Agile;
  let dummyState: State;

  beforeEach(() => {
    jest.clearAllMocks();

    dummyAgile = new Agile({ localStorage: false });
    dummyState = new State(dummyAgile, 'dummyValue');

    jest.spyOn(StatePersistent.prototype, 'instantiatePersistent');
    jest.spyOn(StatePersistent.prototype, 'initialLoading');
    console.error = jest.fn();
  });

  it("should create StatePersistent and shouldn't call initialLoading if Persistent isn't ready (default config)", () => {
    // Overwrite instantiatePersistent once to not call it and set ready property
    jest
      .spyOn(StatePersistent.prototype, 'instantiatePersistent')
      .mockImplementationOnce(function () {
        this.ready = false;
      });

    const statePersistent = new StatePersistent(dummyState);

    expect(statePersistent).toBeInstanceOf(StatePersistent);
    expect(statePersistent.state()).toBe(dummyState);
    expect(statePersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: undefined,
      storageKeys: [],
    });
    expect(statePersistent.initialLoading).not.toHaveBeenCalled();

    expect(statePersistent._key).toBe(StatePersistent.placeHolderKey);
    expect(statePersistent.ready).toBeFalsy();
    expect(statePersistent.isPersisted).toBeFalsy();
    expect(statePersistent.onLoad).toBeUndefined();
    expect(statePersistent.storageKeys).toStrictEqual([]);
    expect(statePersistent.defaultStorageKey).toBeUndefined();
  });

  it("should create StatePersistent and shouldn't call initialLoading if Persistent isn't ready (specific config)", () => {
    // Overwrite instantiatePersistent once to not call it and set ready property
    jest
      .spyOn(StatePersistent.prototype, 'instantiatePersistent')
      .mockImplementationOnce(function () {
        this.ready = false;
      });

    const statePersistent = new StatePersistent(dummyState, {
      key: 'statePersistentKey',
      storageKeys: ['test1', 'test2'],
    });

    expect(statePersistent).toBeInstanceOf(StatePersistent);
    expect(statePersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: 'statePersistentKey',
      storageKeys: ['test1', 'test2'],
    });
    expect(statePersistent.initialLoading).not.toHaveBeenCalled();

    expect(statePersistent._key).toBe(StatePersistent.placeHolderKey);
    expect(statePersistent.ready).toBeFalsy();
    expect(statePersistent.isPersisted).toBeFalsy();
    expect(statePersistent.onLoad).toBeUndefined();
    expect(statePersistent.storageKeys).toStrictEqual([]);
    expect(statePersistent.defaultStorageKey).toBeUndefined();
  });

  it('should create StatePersistent and should call initialLoading if Persistent is ready (default config)', () => {
    // Overwrite instantiatePersistent once to not call it
    jest
      .spyOn(StatePersistent.prototype, 'instantiatePersistent')
      .mockImplementationOnce(function () {
        this.ready = true;
      });

    const statePersistent = new StatePersistent(dummyState);

    expect(statePersistent.initialLoading).toHaveBeenCalled();
  });

  it("should create StatePersistent and shouldn't call initialLoading if Persistent is ready (config.instantiate = false)", () => {
    // Overwrite instantiatePersistent once to not call it and set ready property
    jest
      .spyOn(StatePersistent.prototype, 'instantiatePersistent')
      .mockImplementationOnce(function () {
        this.ready = true;
      });

    const statePersistent = new StatePersistent(dummyState, {
      instantiate: false,
    });

    expect(statePersistent.initialLoading).not.toHaveBeenCalled();
  });

  describe('StatePersistent Function Tests', () => {
    let statePersistent: StatePersistent;

    beforeEach(() => {
      statePersistent = new StatePersistent(dummyState, {
        key: 'statePersistentKey',
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
    });

    describe('setKey function tests', () => {
      beforeEach(() => {
        statePersistent.removePersistedValue = jest.fn();
        statePersistent.persistValue = jest.fn();
        statePersistent.initialLoading = jest.fn();
        jest.spyOn(statePersistent, 'validatePersistent');
      });

      it('should update key with valid key in ready Persistent', async () => {
        statePersistent.ready = true;
        statePersistent._key = 'dummyKey';

        await statePersistent.setKey('newKey');

        expect(statePersistent._key).toBe('newKey');
        expect(statePersistent.ready).toBeTruthy();
        expect(statePersistent.validatePersistent).toHaveBeenCalled();
        expect(statePersistent.initialLoading).not.toHaveBeenCalled();
        expect(statePersistent.persistValue).toHaveBeenCalledWith('newKey');
        expect(statePersistent.removePersistedValue).toHaveBeenCalledWith(
          'dummyKey'
        );
      });

      it('should update key with not valid key in ready Persistent', async () => {
        statePersistent.ready = true;
        statePersistent._key = 'dummyKey';

        await statePersistent.setKey();

        expect(statePersistent._key).toBe(StatePersistent.placeHolderKey);
        expect(statePersistent.ready).toBeFalsy();
        expect(statePersistent.validatePersistent).toHaveBeenCalled();
        expect(statePersistent.initialLoading).not.toHaveBeenCalled();
        expect(statePersistent.persistValue).not.toHaveBeenCalled();
        expect(statePersistent.removePersistedValue).toHaveBeenCalledWith(
          'dummyKey'
        );
      });

      it('should update key with valid key in not ready Persistent', async () => {
        statePersistent.ready = false;

        await statePersistent.setKey('newKey');

        expect(statePersistent._key).toBe('newKey');
        expect(statePersistent.ready).toBeTruthy();
        expect(statePersistent.validatePersistent).toHaveBeenCalled();
        expect(statePersistent.initialLoading).toHaveBeenCalled();
        expect(statePersistent.persistValue).not.toHaveBeenCalled();
        expect(statePersistent.removePersistedValue).not.toHaveBeenCalled();
      });

      it('should update key with not valid key in not ready Persistent', async () => {
        statePersistent.ready = false;

        await statePersistent.setKey();

        expect(statePersistent._key).toBe(StatePersistent.placeHolderKey);
        expect(statePersistent.ready).toBeFalsy();
        expect(statePersistent.validatePersistent).toHaveBeenCalled();
        expect(statePersistent.initialLoading).not.toHaveBeenCalled();
        expect(statePersistent.persistValue).not.toHaveBeenCalled();
        expect(statePersistent.removePersistedValue).not.toHaveBeenCalled();
      });
    });

    describe('initialLoading function tests', () => {
      beforeEach(() => {
        jest.spyOn(Persistent.prototype, 'initialLoading');
      });

      it('should initialLoad and set isPersisted in State to true', async () => {
        await statePersistent.initialLoading();

        expect(Persistent.prototype.initialLoading).toHaveBeenCalled();
        expect(dummyState.isPersisted).toBeTruthy();
      });
    });

    describe('loadPersistedValue function tests', () => {
      beforeEach(() => {
        dummyState.set = jest.fn();
        statePersistent.persistValue = jest.fn();
      });

      it('should load State Value with persistentKey and apply it to the State if loading was successful', async () => {
        statePersistent.ready = true;
        dummyAgile.storages.get = jest.fn(() =>
          Promise.resolve('dummyValue' as any)
        );

        const response = await statePersistent.loadPersistedValue();

        expect(response).toBeTruthy();
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          statePersistent._key,
          statePersistent.defaultStorageKey
        );
        expect(dummyState.set).toHaveBeenCalledWith('dummyValue', {
          storage: false,
        });
        expect(statePersistent.persistValue).toHaveBeenCalledWith(
          statePersistent._key
        );
      });

      it("should load State Value with persistentKey and shouldn't apply it to the State if loading wasn't successful", async () => {
        statePersistent.ready = true;
        dummyAgile.storages.get = jest.fn(() =>
          Promise.resolve(undefined as any)
        );

        const response = await statePersistent.loadPersistedValue();

        expect(response).toBeFalsy();
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          statePersistent._key,
          statePersistent.defaultStorageKey
        );
        expect(dummyState.set).not.toHaveBeenCalled();
        expect(statePersistent.persistValue).not.toHaveBeenCalled();
      });

      it('should load State Value with specific Key and apply it to the State if loading was successful', async () => {
        statePersistent.ready = true;
        dummyAgile.storages.get = jest.fn(() =>
          Promise.resolve('dummyValue' as any)
        );

        const response = await statePersistent.loadPersistedValue('coolKey');

        expect(response).toBeTruthy();
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          'coolKey',
          statePersistent.defaultStorageKey
        );
        expect(dummyState.set).toHaveBeenCalledWith('dummyValue', {
          storage: false,
        });
        expect(statePersistent.persistValue).toHaveBeenCalledWith('coolKey');
      });

      it("shouldn't load State Value if Persistent isn't ready", async () => {
        statePersistent.ready = false;
        dummyAgile.storages.get = jest.fn(() =>
          Promise.resolve(undefined as any)
        );

        const response = await statePersistent.loadPersistedValue();

        expect(response).toBeFalsy();
        expect(dummyAgile.storages.get).not.toHaveBeenCalled();
        expect(dummyState.set).not.toHaveBeenCalled();
        expect(statePersistent.persistValue).not.toHaveBeenCalled();
      });
    });

    describe('persistValue function tests', () => {
      beforeEach(() => {
        dummyState.addSideEffect = jest.fn();
        statePersistent.rebuildStorageSideEffect = jest.fn();

        statePersistent.isPersisted = false;
      });

      it('should persist State with persistentKey', async () => {
        statePersistent.ready = true;

        const response = await statePersistent.persistValue();

        expect(response).toBeTruthy();
        expect(
          dummyState.addSideEffect
        ).toHaveBeenCalledWith(
          StatePersistent.storeValueSideEffectKey,
          expect.any(Function),
          { weight: 0 }
        );
        expect(statePersistent.rebuildStorageSideEffect).toHaveBeenCalledWith(
          dummyState,
          statePersistent._key
        );
        expect(statePersistent.isPersisted).toBeTruthy();
      });

      it('should persist State with specific Key', async () => {
        statePersistent.ready = true;

        const response = await statePersistent.persistValue('coolKey');

        expect(response).toBeTruthy();
        expect(
          dummyState.addSideEffect
        ).toHaveBeenCalledWith(
          StatePersistent.storeValueSideEffectKey,
          expect.any(Function),
          { weight: 0 }
        );
        expect(statePersistent.rebuildStorageSideEffect).toHaveBeenCalledWith(
          dummyState,
          'coolKey'
        );
        expect(statePersistent.isPersisted).toBeTruthy();
      });

      it("shouldn't persist State if Persistent isn't ready", async () => {
        statePersistent.ready = false;

        const response = await statePersistent.persistValue();

        expect(response).toBeFalsy();
        expect(dummyState.addSideEffect).not.toHaveBeenCalled();
        expect(statePersistent.rebuildStorageSideEffect).not.toHaveBeenCalled();
        expect(statePersistent.isPersisted).toBeFalsy();
      });

      describe('test added sideEffect called StatePersistent.storeValueSideEffectKey', () => {
        beforeEach(() => {
          statePersistent.rebuildStorageSideEffect = jest.fn();
        });

        it('should call rebuildStorageSideEffect', async () => {
          await statePersistent.persistValue();

          dummyState.sideEffects[
            StatePersistent.storeValueSideEffectKey
          ].callback({
            dummy: 'property',
          });

          expect(statePersistent.rebuildStorageSideEffect).toHaveBeenCalledWith(
            dummyState,
            statePersistent._key,
            {
              dummy: 'property',
            }
          );
        });
      });
    });

    describe('removePersistedValue function tests', () => {
      beforeEach(() => {
        dummyState.removeSideEffect = jest.fn();
        dummyAgile.storages.remove = jest.fn();

        statePersistent.isPersisted = true;
      });

      it('should remove persisted State from Storage with persistentKey', async () => {
        statePersistent.ready = true;

        const response = await statePersistent.removePersistedValue();

        expect(response).toBeTruthy();
        expect(dummyState.removeSideEffect).toHaveBeenCalledWith(
          StatePersistent.storeValueSideEffectKey
        );
        expect(dummyAgile.storages.remove).toHaveBeenCalledWith(
          statePersistent._key,
          statePersistent.storageKeys
        );
        expect(statePersistent.isPersisted).toBeFalsy();
      });

      it('should remove persisted State from Storage with specific Key', async () => {
        statePersistent.ready = true;

        const response = await statePersistent.removePersistedValue('coolKey');

        expect(response).toBeTruthy();
        expect(dummyState.removeSideEffect).toHaveBeenCalledWith(
          StatePersistent.storeValueSideEffectKey
        );
        expect(dummyAgile.storages.remove).toHaveBeenCalledWith(
          'coolKey',
          statePersistent.storageKeys
        );
        expect(statePersistent.isPersisted).toBeFalsy();
      });

      it("shouldn't remove State from Storage if Persistent isn't ready", async () => {
        statePersistent.ready = false;

        const response = await statePersistent.removePersistedValue('coolKey');

        expect(response).toBeFalsy();
        expect(dummyState.removeSideEffect).not.toHaveBeenCalled();
        expect(dummyAgile.storages.remove).not.toHaveBeenCalled();
        expect(statePersistent.isPersisted).toBeTruthy();
      });
    });

    describe('formatKey function tests', () => {
      it('should return key of State if no key got passed', () => {
        dummyState._key = 'coolKey';

        const response = statePersistent.formatKey();

        expect(response).toBe('coolKey');
      });

      it('should return passed key', () => {
        dummyState._key = 'coolKey';

        const response = statePersistent.formatKey('awesomeKey');

        expect(response).toBe('awesomeKey');
      });

      it('should return and apply passed key to State if State had no own key before', () => {
        dummyState._key = undefined;

        const response = statePersistent.formatKey('awesomeKey');

        expect(response).toBe('awesomeKey');
        expect(dummyState._key).toBe('awesomeKey');
      });

      it('should return undefined if no key got passed and State has no key', () => {
        dummyState._key = undefined;

        const response = statePersistent.formatKey();

        expect(response).toBeUndefined();
      });
    });

    describe('rebuildStorageSideEffect function tests', () => {
      beforeEach(() => {
        dummyAgile.storages.set = jest.fn();
      });

      it('should save State Value in Storage (default config)', () => {
        statePersistent.rebuildStorageSideEffect(dummyState, 'coolKey');

        expect(dummyAgile.storages.set).toHaveBeenCalledWith(
          'coolKey',
          dummyState.getPersistableValue(),
          statePersistent.storageKeys
        );
      });

      it("shouldn't save State Value in Storage (config.storage = false)", () => {
        statePersistent.rebuildStorageSideEffect(dummyState, 'coolKey', {
          storage: false,
        });

        expect(dummyAgile.storages.set).not.toHaveBeenCalled();
      });
    });
  });
});
