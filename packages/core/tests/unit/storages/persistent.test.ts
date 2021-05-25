import { Agile, Persistent, Storage } from '../../../src';
import { LogMock } from '../../helper/logMock';

describe('Persistent Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    LogMock.mockLogs();

    dummyAgile = new Agile({ localStorage: false });

    jest.spyOn(Persistent.prototype, 'instantiatePersistent');
  });

  it('should create Persistent (default config)', () => {
    // Overwrite instantiatePersistent once to not call it
    jest
      .spyOn(Persistent.prototype, 'instantiatePersistent')
      .mockReturnValueOnce(undefined);

    const persistent = new Persistent(dummyAgile);

    expect(persistent).toBeInstanceOf(Persistent);
    expect(persistent.instantiatePersistent).toHaveBeenCalledWith({
      storageKeys: [],
      key: undefined,
      defaultStorageKey: null,
    });
    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    expect(persistent._key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.config).toStrictEqual({ defaultStorageKey: null });
  });

  it('should create Persistent (specific config)', () => {
    // Overwrite instantiatePersistent once to not call it
    jest
      .spyOn(Persistent.prototype, 'instantiatePersistent')
      .mockReturnValueOnce(undefined);

    const persistent = new Persistent(dummyAgile, {
      storageKeys: ['test1', 'test2'],
      key: 'persistentKey',
      defaultStorageKey: 'test1',
    });

    expect(persistent).toBeInstanceOf(Persistent);
    expect(persistent.instantiatePersistent).toHaveBeenCalledWith({
      storageKeys: ['test1', 'test2'],
      key: 'persistentKey',
      defaultStorageKey: 'test1',
    });
    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    expect(persistent._key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.config).toStrictEqual({ defaultStorageKey: 'test1' });
  });

  it('should create Persistent (config.instantiate = false)', () => {
    // Overwrite instantiatePersistent once to not call it
    jest
      .spyOn(Persistent.prototype, 'instantiatePersistent')
      .mockReturnValueOnce(undefined);

    const persistent = new Persistent(dummyAgile, { instantiate: false });

    expect(persistent).toBeInstanceOf(Persistent);
    expect(persistent.instantiatePersistent).not.toHaveBeenCalled();
    expect(
      dummyAgile.storages.persistentInstances.has(persistent)
    ).toBeTruthy();

    expect(persistent._key).toBe(Persistent.placeHolderKey);
    expect(persistent.ready).toBeFalsy();
    expect(persistent.isPersisted).toBeFalsy();
    expect(persistent.onLoad).toBeUndefined();
    expect(persistent.storageKeys).toStrictEqual([]);
    expect(persistent.config).toStrictEqual({ defaultStorageKey: null });
  });

  describe('Persistent Function Tests', () => {
    let persistent: Persistent;

    beforeEach(() => {
      persistent = new Persistent(dummyAgile);

      jest.clearAllMocks(); // Because creating Persistent executes some mocks
    });

    describe('key set function tests', () => {
      it('should call setKey with passed value', () => {
        persistent.setKey = jest.fn();

        persistent.key = 'dummyKey';

        expect(persistent.setKey).toHaveBeenCalledWith('dummyKey');
      });
    });

    describe('ket get function tests', () => {
      it('should get key property of Persistent', () => {
        persistent._key = 'dummyKey';

        expect(persistent.key).toBe('dummyKey');
      });
    });

    describe('instantiatePersistent function tests', () => {
      it('should call assign key to formatKey and call assignStorageKeys, validatePersistent', () => {
        jest.spyOn(persistent, 'formatKey');
        jest.spyOn(persistent, 'assignStorageKeys');
        jest.spyOn(persistent, 'validatePersistent');

        persistent.instantiatePersistent({
          key: 'persistentKey',
          storageKeys: ['myName', 'is', 'jeff'],
          defaultStorageKey: 'jeff',
        });

        expect(persistent._key).toBe('persistentKey');
        expect(persistent.formatKey).toHaveBeenCalledWith('persistentKey');
        expect(persistent.assignStorageKeys).toHaveBeenCalledWith(
          ['myName', 'is', 'jeff'],
          'jeff'
        );
        expect(persistent.validatePersistent).toHaveBeenCalled();
      });
    });

    describe('validatePersistent function tests', () => {
      beforeEach(() => {
        persistent.key = Persistent.placeHolderKey;
        persistent.config.defaultStorageKey = null;
        persistent.storageKeys = [];
        persistent.ready = undefined as any;
      });

      it('should return false and print error if no set key and no set StorageKeys', () => {
        const isValid = persistent.validatePersistent();

        expect(isValid).toBeFalsy();
        expect(persistent.ready).toBeFalsy();

        LogMock.hasLoggedCode('12:03:00');
      });

      it('should return false and print error if set key and no set StorageKeys', () => {
        persistent._key = 'persistentKey';

        const isValid = persistent.validatePersistent();

        expect(isValid).toBeFalsy();
        expect(persistent.ready).toBeFalsy();

        LogMock.hasLoggedCode('12:03:01');
      });

      it('should return false and print error if no set key and set StorageKeys', () => {
        persistent.config.defaultStorageKey = 'test';
        persistent.storageKeys = ['test'];

        const isValid = persistent.validatePersistent();

        expect(isValid).toBeFalsy();
        expect(persistent.ready).toBeFalsy();

        LogMock.hasLoggedCode('12:03:00');
      });

      it('should return false and print error if set key and set StorageKeys but no existing Storage at storageKeys', () => {
        persistent.config.defaultStorageKey = 'test';
        persistent.storageKeys = ['test'];

        const isValid = persistent.validatePersistent();

        expect(isValid).toBeFalsy();
        expect(persistent.ready).toBeFalsy();

        LogMock.hasLoggedCode('12:03:00');
      });

      it('should return true if set key and set StorageKeys', () => {
        dummyAgile.storages.register(
          dummyAgile.createStorage({
            key: 'test',
            methods: {
              get: () => {
                /* empty */
              },
              set: () => {
                /* empty */
              },
              remove: () => {
                /* empty */
              },
            },
          })
        );

        persistent._key = 'persistentKey';
        persistent.config.defaultStorageKey = 'test';
        persistent.storageKeys = ['test'];

        const isValid = persistent.validatePersistent();

        expect(isValid).toBeTruthy();
        expect(persistent.ready).toBeTruthy();
      });
    });

    describe('assignStorageKeys function tests', () => {
      it('should assign passed StorageKeys and set first one as default StorageKey if no default Storage Key passed', () => {
        persistent.assignStorageKeys(['test1', 'test2', 'test3']);

        expect(persistent.storageKeys).toStrictEqual([
          'test1',
          'test2',
          'test3',
        ]);
        expect(persistent.config.defaultStorageKey).toBe('test1');
        LogMock.hasNotLogged('warn');
      });

      it('should assign passed StorageKeys and set passed defaultStorageKey as default StorageKey', () => {
        persistent.assignStorageKeys(['test1', 'test2', 'test3'], 'test3');

        expect(persistent.storageKeys).toStrictEqual([
          'test1',
          'test2',
          'test3',
        ]);
        expect(persistent.config.defaultStorageKey).toBe('test3');
        LogMock.hasNotLogged('warn');
      });

      it(
        'should assign passed StorageKeys, set passed as defaultStorageKey as default StorageKey' +
          'and push defaultStorageKey into storageKeys',
        () => {
          persistent.assignStorageKeys(['test1', 'test2', 'test3'], 'test4');

          expect(persistent.storageKeys).toStrictEqual([
            'test1',
            'test2',
            'test3',
            'test4',
          ]);
          expect(persistent.config.defaultStorageKey).toBe('test4');
        }
      );

      it('should try to get default StorageKey from Agile if no StorageKey got passed', () => {
        dummyAgile.storages.register(
          new Storage({
            key: 'storage1',
            methods: {
              get: () => {
                /* empty function */
              },
              set: () => {
                /* empty function */
              },
              remove: () => {
                /* empty function */
              },
            },
          }),
          { default: true }
        );

        persistent.assignStorageKeys();

        expect(persistent.storageKeys).toStrictEqual(['storage1']);
        expect(persistent.config.defaultStorageKey).toBe('storage1');
        LogMock.hasNotLogged('warn');
      });
    });

    describe('initialLoading function tests', () => {
      beforeEach(() => {
        persistent.onLoad = jest.fn();
        persistent.loadPersistedValue = jest.fn();
        persistent.persistValue = jest.fn();
      });

      it("shouldn't call persistValue if value got successful loaded", async () => {
        persistent.loadPersistedValue = jest.fn(() => Promise.resolve(true));

        await persistent.initialLoading();

        expect(persistent.loadPersistedValue).toHaveBeenCalled();
        expect(persistent.persistValue).not.toHaveBeenCalled();
        expect(persistent.onLoad).toHaveBeenCalledWith(true);
      });

      it("should call persistValue if value doesn't got successful loaded", async () => {
        persistent.loadPersistedValue = jest.fn(() => Promise.resolve(false));

        await persistent.initialLoading();

        expect(persistent.loadPersistedValue).toHaveBeenCalled();
        expect(persistent.persistValue).toHaveBeenCalled();
        expect(persistent.onLoad).toHaveBeenCalledWith(false);
      });
    });

    describe('loadPersistedValue function tests', () => {
      it('should print error', () => {
        persistent.loadPersistedValue();

        LogMock.hasLoggedCode('00:03:00', ['loadPersistedValue', 'Persistent']);
      });
    });

    describe('persistValue function tests', () => {
      it('should print error', () => {
        persistent.persistValue();

        LogMock.hasLoggedCode('00:03:00', ['persistValue', 'Persistent']);
      });
    });

    describe('removePersistedValue function tests', () => {
      it('should print error', () => {
        persistent.removePersistedValue();

        LogMock.hasLoggedCode('00:03:00', [
          'removePersistedValue',
          'Persistent',
        ]);
      });

      describe('formatKey function tests', () => {
        it('should return passed key', () => {
          expect(persistent.formatKey('test')).toBe('test');
        });
      });
    });
  });
});
