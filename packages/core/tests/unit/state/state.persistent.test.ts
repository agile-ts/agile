import {
  Agile,
  StatePersistent,
  Storage,
  Persistent,
  EnhancedState,
  Storages,
  assignSharedStorageManager,
  createStorageManager,
} from '../../../src';
import { LogMock } from '../../helper/logMock';
import waitForExpect from 'wait-for-expect';

describe('StatePersistent Tests', () => {
  let dummyAgile: Agile;
  let dummyState: EnhancedState;
  let storageManager: Storages;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile();
    dummyState = new EnhancedState(dummyAgile, 'dummyValue');

    // Register Storage Manager
    storageManager = createStorageManager();
    assignSharedStorageManager(storageManager);

    jest.spyOn(StatePersistent.prototype, 'instantiatePersistent');
    jest.spyOn(StatePersistent.prototype, 'initialLoading');

    jest.clearAllMocks();
  });

  it('should create StatePersistent and should call initialLoading if Persistent is ready (default config)', () => {
    // Overwrite instantiatePersistent once to not call it
    jest
      .spyOn(StatePersistent.prototype, 'instantiatePersistent')
      .mockImplementationOnce(function () {
        // @ts-ignore
        this.ready = true;
      });

    const statePersistent = new StatePersistent(dummyState);

    expect(statePersistent).toBeInstanceOf(StatePersistent);

    expect(statePersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: undefined,
      storageKeys: [],
      defaultStorageKey: null,
    });
    expect(statePersistent.initialLoading).toHaveBeenCalled();

    // Check if Persistent was called with correct parameters
    expect(statePersistent._key).toBe(StatePersistent.placeHolderKey);
    expect(statePersistent.ready).toBeTruthy();
    expect(statePersistent.isPersisted).toBeFalsy();
    expect(statePersistent.onLoad).toBeUndefined();
    expect(statePersistent.storageKeys).toStrictEqual([]);
    expect(statePersistent.config).toStrictEqual({
      defaultStorageKey: null, // gets set in 'instantiatePersistent' which is mocked
    });
  });

  it('should create StatePersistent and should call initialLoading if Persistent is ready (specific config)', () => {
    // Overwrite instantiatePersistent once to not call it and set ready property
    jest
      .spyOn(StatePersistent.prototype, 'instantiatePersistent')
      .mockImplementationOnce(function () {
        // @ts-ignore
        this.ready = true;
      });

    const statePersistent = new StatePersistent(dummyState, {
      key: 'statePersistentKey',
      storageKeys: ['test1', 'test2'],
      defaultStorageKey: 'test2',
    });

    expect(statePersistent).toBeInstanceOf(StatePersistent);
    expect(statePersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: 'statePersistentKey',
      storageKeys: ['test1', 'test2'],
      defaultStorageKey: 'test2',
    });
    expect(statePersistent.initialLoading).toHaveBeenCalled();

    // Check if Persistent was called with correct parameters
    expect(statePersistent._key).toBe(StatePersistent.placeHolderKey);
    expect(statePersistent.ready).toBeTruthy();
    expect(statePersistent.isPersisted).toBeFalsy();
    expect(statePersistent.onLoad).toBeUndefined();
    expect(statePersistent.storageKeys).toStrictEqual([]);
    expect(statePersistent.config).toStrictEqual({
      defaultStorageKey: null, // gets set in 'instantiatePersistent' which is mocked
    });
  });

  it("should create StatePersistent and shouldn't call initialLoading if Persistent isn't ready", () => {
    // Overwrite instantiatePersistent once to not call it and set ready property
    jest
      .spyOn(StatePersistent.prototype, 'instantiatePersistent')
      .mockImplementationOnce(function () {
        // @ts-ignore
        this.ready = false;
      });

    const statePersistent = new StatePersistent(dummyState);

    expect(statePersistent).toBeInstanceOf(StatePersistent);
    expect(statePersistent.state()).toBe(dummyState);
    expect(statePersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: undefined,
      storageKeys: [],
      defaultStorageKey: null,
    });
    expect(statePersistent.initialLoading).not.toHaveBeenCalled();

    // Check if Persistent was called with correct parameters
    expect(statePersistent._key).toBe(StatePersistent.placeHolderKey);
    expect(statePersistent.ready).toBeFalsy();
    expect(statePersistent.isPersisted).toBeFalsy();
    expect(statePersistent.onLoad).toBeUndefined();
    expect(statePersistent.storageKeys).toStrictEqual([]);
    expect(statePersistent.config).toStrictEqual({ defaultStorageKey: null });
  });

  it("should create StatePersistent and shouldn't call initialLoading if Persistent is ready (config.loadValue = false)", () => {
    // Overwrite instantiatePersistent once to not call it and set ready property
    jest
      .spyOn(StatePersistent.prototype, 'instantiatePersistent')
      .mockImplementationOnce(function () {
        // @ts-ignore
        this.ready = true;
      });

    const statePersistent = new StatePersistent(dummyState, {
      loadValue: false,
    });

    expect(statePersistent).toBeInstanceOf(StatePersistent);
    expect(statePersistent.state()).toBe(dummyState);
    expect(statePersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: undefined,
      storageKeys: [],
      defaultStorageKey: null,
    });
    expect(statePersistent.initialLoading).not.toHaveBeenCalled();

    // Check if Persistent was called with correct parameters
    expect(statePersistent._key).toBe(StatePersistent.placeHolderKey);
    expect(statePersistent.ready).toBeTruthy();
    expect(statePersistent.isPersisted).toBeFalsy();
    expect(statePersistent.onLoad).toBeUndefined();
    expect(statePersistent.storageKeys).toStrictEqual([]);
    expect(statePersistent.config).toStrictEqual({ defaultStorageKey: null });
  });

  describe('StatePersistent Function Tests', () => {
    let statePersistent: StatePersistent;

    beforeEach(() => {
      statePersistent = new StatePersistent(dummyState, {
        key: 'statePersistentKey',
        storageKeys: ['dummyStorage'],
      });
      storageManager.register(
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

    describe('initialLoading function tests', () => {
      beforeEach(() => {
        jest.spyOn(Persistent.prototype, 'initialLoading');
      });

      it('should initialLoad and set isPersisted in State to true', async () => {
        await statePersistent.initialLoading();

        await waitForExpect(() => {
          expect(Persistent.prototype.initialLoading).toHaveBeenCalled();
          expect(dummyState.isPersisted).toBeTruthy();
        });
      });
    });

    describe('loadPersistedValue function tests', () => {
      beforeEach(() => {
        dummyState.set = jest.fn();
        statePersistent.setupSideEffects = jest.fn();
      });

      it(
        'should load State value with Persistent key from the corresponding Storage ' +
          'and apply it to the State if the loading was successful',
        async () => {
          statePersistent.ready = true;
          storageManager.get = jest.fn(() =>
            Promise.resolve('dummyValue' as any)
          );

          const response = await statePersistent.loadPersistedValue();

          expect(response).toBeTruthy();
          expect(storageManager.get).toHaveBeenCalledWith(
            statePersistent._key,
            statePersistent.config.defaultStorageKey
          );
          expect(dummyState.set).toHaveBeenCalledWith('dummyValue', {
            storage: false,
            overwrite: true,
          });
          expect(statePersistent.setupSideEffects).toHaveBeenCalledWith(
            statePersistent._key
          );
        }
      );

      it(
        "should load State value with Persistent key from the corresponding Storage, migrate it with the 'onMigrate()' method " +
          'and apply it to the State if the loading was successful',
        async () => {
          statePersistent.ready = true;
          storageManager.get = jest.fn(() =>
            Promise.resolve('dummyValue' as any)
          );
          statePersistent.onMigrate = jest.fn((value) => `migrated_${value}`);

          const response = await statePersistent.loadPersistedValue();

          expect(response).toBeTruthy();
          expect(storageManager.get).toHaveBeenCalledWith(
            statePersistent._key,
            statePersistent.config.defaultStorageKey
          );
          expect(dummyState.set).toHaveBeenCalledWith('migrated_dummyValue', {
            storage: false,
            overwrite: true,
          });
          expect(statePersistent.onMigrate).toHaveBeenCalledWith('dummyValue');
          expect(statePersistent.setupSideEffects).toHaveBeenCalledWith(
            statePersistent._key
          );
        }
      );

      it(
        "shouldn't load State value with Persistent key from the corresponding Storage " +
          "and apply it to the State if the loading wasn't successful",
        async () => {
          statePersistent.ready = true;
          storageManager.get = jest.fn(() => Promise.resolve(undefined as any));

          const response = await statePersistent.loadPersistedValue();

          expect(response).toBeFalsy();
          expect(storageManager.get).toHaveBeenCalledWith(
            statePersistent._key,
            statePersistent.config.defaultStorageKey
          );
          expect(dummyState.set).not.toHaveBeenCalled();
          expect(statePersistent.setupSideEffects).not.toHaveBeenCalled();
        }
      );

      it(
        'should load State value with specified key from the corresponding Storage ' +
          'and apply it to the State if the loading was successful',
        async () => {
          statePersistent.ready = true;
          storageManager.get = jest.fn(() =>
            Promise.resolve('dummyValue' as any)
          );

          const response = await statePersistent.loadPersistedValue('coolKey');

          expect(response).toBeTruthy();
          expect(storageManager.get).toHaveBeenCalledWith(
            'coolKey',
            statePersistent.config.defaultStorageKey
          );
          expect(dummyState.set).toHaveBeenCalledWith('dummyValue', {
            storage: false,
            overwrite: true,
          });
          expect(statePersistent.setupSideEffects).toHaveBeenCalledWith(
            'coolKey'
          );
        }
      );

      it(
        "shouldn't load State value from the corresponding Storage " +
          "if Persistent isn't ready yet",
        async () => {
          statePersistent.ready = false;
          storageManager.get = jest.fn(() => Promise.resolve(undefined as any));

          const response = await statePersistent.loadPersistedValue();

          expect(response).toBeFalsy();
          expect(storageManager.get).not.toHaveBeenCalled();
          expect(dummyState.set).not.toHaveBeenCalled();
          expect(statePersistent.setupSideEffects).not.toHaveBeenCalled();
        }
      );
    });

    describe('persistValue function tests', () => {
      beforeEach(() => {
        statePersistent.setupSideEffects = jest.fn();
        statePersistent.rebuildStorageSideEffect = jest.fn();

        statePersistent.isPersisted = false;
      });

      it('should persist State value with Persistent key', async () => {
        statePersistent.ready = true;

        const response = await statePersistent.persistValue();

        expect(response).toBeTruthy();
        expect(statePersistent.setupSideEffects).toHaveBeenCalledWith(
          statePersistent._key
        );
        expect(statePersistent.rebuildStorageSideEffect).toHaveBeenCalledWith(
          dummyState,
          statePersistent._key
        );
        expect(statePersistent.isPersisted).toBeTruthy();
      });

      it('should persist State value with specified key', async () => {
        statePersistent.ready = true;

        const response = await statePersistent.persistValue('coolKey');

        expect(response).toBeTruthy();
        expect(statePersistent.setupSideEffects).toHaveBeenCalledWith(
          'coolKey'
        );
        expect(statePersistent.rebuildStorageSideEffect).toHaveBeenCalledWith(
          dummyState,
          'coolKey'
        );
        expect(statePersistent.isPersisted).toBeTruthy();
      });

      it("shouldn't persist State if Persistent isn't ready yet", async () => {
        statePersistent.ready = false;

        const response = await statePersistent.persistValue();

        expect(response).toBeFalsy();
        expect(statePersistent.setupSideEffects).not.toHaveBeenCalled();
        expect(statePersistent.rebuildStorageSideEffect).not.toHaveBeenCalled();
        expect(statePersistent.isPersisted).toBeFalsy();
      });
    });

    describe('setupSideEffects function tests', () => {
      beforeEach(() => {
        jest.spyOn(dummyState, 'addSideEffect');
      });

      it(
        'should add side effects for keeping the State value in sync ' +
          'with the Storage value to the State',
        () => {
          statePersistent.setupSideEffects();

          expect(
            dummyState.addSideEffect
          ).toHaveBeenCalledWith(
            StatePersistent.storeValueSideEffectKey,
            expect.any(Function),
            { weight: 0 }
          );
        }
      );

      describe("test added sideEffect called 'StatePersistent.storeValueSideEffectKey'", () => {
        beforeEach(() => {
          statePersistent.rebuildStorageSideEffect = jest.fn();
        });

        it("should call 'rebuildStorageSideEffect' (persistentKey)", async () => {
          await statePersistent.setupSideEffects();

          dummyState.sideEffects[
            StatePersistent.storeValueSideEffectKey
          ].callback(dummyState, {
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

        it("should call 'rebuildStorageSideEffect' (specified key)", async () => {
          await statePersistent.setupSideEffects('dummyKey');

          dummyState.sideEffects[
            StatePersistent.storeValueSideEffectKey
          ].callback(dummyState, {
            dummy: 'property',
          });

          expect(statePersistent.rebuildStorageSideEffect).toHaveBeenCalledWith(
            dummyState,
            'dummyKey',
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
        storageManager.remove = jest.fn();

        statePersistent.isPersisted = true;
      });

      it('should remove persisted State value from the corresponding Storage with Persistent key', async () => {
        statePersistent.ready = true;

        const response = await statePersistent.removePersistedValue();

        expect(response).toBeTruthy();
        expect(dummyState.removeSideEffect).toHaveBeenCalledWith(
          StatePersistent.storeValueSideEffectKey
        );
        expect(storageManager.remove).toHaveBeenCalledWith(
          statePersistent._key,
          statePersistent.storageKeys
        );
        expect(statePersistent.isPersisted).toBeFalsy();
      });

      it('should remove persisted State from the corresponding Storage with specified key', async () => {
        statePersistent.ready = true;

        const response = await statePersistent.removePersistedValue('coolKey');

        expect(response).toBeTruthy();
        expect(dummyState.removeSideEffect).toHaveBeenCalledWith(
          StatePersistent.storeValueSideEffectKey
        );
        expect(storageManager.remove).toHaveBeenCalledWith(
          'coolKey',
          statePersistent.storageKeys
        );
        expect(statePersistent.isPersisted).toBeFalsy();
      });

      it("shouldn't remove State from the corresponding Storage if Persistent isn't ready yet", async () => {
        statePersistent.ready = false;

        const response = await statePersistent.removePersistedValue('coolKey');

        expect(response).toBeFalsy();
        expect(dummyState.removeSideEffect).not.toHaveBeenCalled();
        expect(storageManager.remove).not.toHaveBeenCalled();
        expect(statePersistent.isPersisted).toBeTruthy();
      });
    });

    describe('formatKey function tests', () => {
      it('should return key of the State if no valid key was specified', () => {
        dummyState._key = 'coolKey';

        const response = statePersistent.formatKey(undefined);

        expect(response).toBe('coolKey');
      });

      it('should return specified key', () => {
        dummyState._key = 'coolKey';

        const response = statePersistent.formatKey('awesomeKey');

        expect(response).toBe('awesomeKey');
      });

      it('should return and apply specified key to State if State had no own valid key before', () => {
        dummyState._key = undefined;

        const response = statePersistent.formatKey('awesomeKey');

        expect(response).toBe('awesomeKey');
        expect(dummyState._key).toBe('awesomeKey');
      });

      it('should return undefined if no valid key was specified and State has no valid key either', () => {
        dummyState._key = undefined;

        const response = statePersistent.formatKey(undefined);

        expect(response).toBeUndefined();
      });
    });

    describe('rebuildStorageSideEffect function tests', () => {
      beforeEach(() => {
        storageManager.set = jest.fn();
      });

      it('should store current State value in the corresponding Storage (default config)', () => {
        statePersistent.rebuildStorageSideEffect(dummyState, 'coolKey');

        expect(storageManager.set).toHaveBeenCalledWith(
          'coolKey',
          dummyState.getPersistableValue(),
          statePersistent.storageKeys
        );
      });

      it(
        'should store current State value in the corresponding Storage ' +
          "and format it with the 'onSave()' method (default config)",
        () => {
          statePersistent.onSave = jest.fn((value) => `save_${value}`);

          statePersistent.rebuildStorageSideEffect(dummyState, 'coolKey');

          expect(storageManager.set).toHaveBeenCalledWith(
            'coolKey',
            `save_${dummyState.getPersistableValue()}`,
            statePersistent.storageKeys
          );
          expect(statePersistent.onSave).toHaveBeenCalledWith(
            dummyState.getPersistableValue()
          );
        }
      );

      it("shouldn't store State value in the corresponding Storage (config.storage = false)", () => {
        statePersistent.rebuildStorageSideEffect(dummyState, 'coolKey', {
          storage: false,
        });

        expect(storageManager.set).not.toHaveBeenCalled();
      });
    });
  });
});
