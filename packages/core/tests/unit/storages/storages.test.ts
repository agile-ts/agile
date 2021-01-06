import { Storages, Agile, Storage, Persistent } from '../../../src';

describe('Storages Tests', () => {
  let dummyAgile;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });

    jest.spyOn(Storages.prototype, 'instantiateLocalStorage');
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  it('should create Storages (default config)', () => {
    const storages = new Storages(dummyAgile);

    expect(storages.defaultStorage).toBeUndefined();
    expect(storages.storages).toStrictEqual({});
    expect(storages.persistentInstances.size).toBe(0);
    expect(storages.instantiateLocalStorage).not.toHaveBeenCalled();
  });

  it('should create Storages and should get a warning (config.localStorage = true)', () => {
    const storages = new Storages(dummyAgile, { localStorage: true });

    expect(storages.defaultStorage).toBeUndefined();
    expect(storages.storages).toStrictEqual({});
    expect(storages.persistentInstances.size).toBe(0);
    expect(storages.instantiateLocalStorage).toHaveBeenCalled();
  });

  describe('Storages Function Tests', () => {
    let storages: Storages;
    let dummyStorage1: Storage;
    let dummyStorage2: Storage;
    let dummyStorage3: Storage;
    let dummyStorageMethods;

    beforeEach(() => {
      storages = new Storages(dummyAgile);
      dummyAgile.storages = storages;
      dummyStorageMethods = {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
      };

      dummyStorage1 = new Storage({
        key: 'storage1',
        methods: dummyStorageMethods,
      });
      dummyStorage2 = new Storage({
        key: 'storage2',
        methods: dummyStorageMethods,
      });
      dummyStorage3 = new Storage({
        key: 'storage3',
        methods: dummyStorageMethods,
      });
    });

    describe('instantiateLocalStorage function tests', () => {
      beforeEach(() => {
        global.localStorage = {
          getItem: jest.fn(),
          removeItem: jest.fn(),
          setItem: jest.fn(),
        } as any;

        storages.register = jest.fn(() => true);
      });

      it('should register localStorage if localStorage is available', () => {
        jest.spyOn(Storages, 'localStorageAvailable').mockReturnValueOnce(true);

        const response = storages.instantiateLocalStorage();

        expect(response).toBeTruthy();
        expect(storages.register).toHaveBeenCalledWith(expect.any(Storage), {
          default: true,
        });
      });

      it("shouldn't register localStorage if localStorage isn't available", () => {
        jest
          .spyOn(Storages, 'localStorageAvailable')
          .mockReturnValueOnce(false);

        const response = storages.instantiateLocalStorage();

        expect(response).toBeFalsy();
        expect(storages.register).not.toHaveBeenCalled();
      });
    });

    describe('register function tests', () => {
      it('should register Storage and assign it as default Storage (default config)', () => {
        const response = storages.register(dummyStorage1);

        expect(storages.storages).toHaveProperty('storage1');
        expect(storages.storages['storage1']).toBe(dummyStorage1);
        expect(storages.defaultStorage).toBe(dummyStorage1);
        expect(response).toBeTruthy();
      });

      it('should register Storage and assign it as default Storage with a warning (config.default = false)', () => {
        const response = storages.register(dummyStorage1, { default: false });

        expect(console.warn).toHaveBeenCalledWith(
          'Agile Warn: Be aware that Agile has to assign the first added Storage as default Storage!',
        );

        expect(storages.storages).toHaveProperty('storage1');
        expect(storages.storages['storage1']).toBe(dummyStorage1);
        expect(storages.defaultStorage).toBe(dummyStorage1);
        expect(response).toBeTruthy();
      });

      it("should register second Storage and shouldn't assign it as default Storage (default config)", () => {
        storages.register(dummyStorage1);

        const response = storages.register(dummyStorage2);

        expect(storages.storages).toHaveProperty('storage2');
        expect(storages.storages['storage2']).toBe(dummyStorage2);
        expect(storages.defaultStorage).toBe(dummyStorage1);
        expect(response).toBeTruthy();
      });

      it('should register second Storage and should assign it as default Storage (config.default = true)', () => {
        storages.register(dummyStorage1);

        const response = storages.register(dummyStorage2, { default: true });

        expect(storages.storages).toHaveProperty('storage2');
        expect(storages.storages['storage2']).toBe(dummyStorage2);
        expect(storages.defaultStorage).toBe(dummyStorage2);
        expect(response).toBeTruthy();
      });

      it("shouldn't register Storage with the same key twice", () => {
        const dummyStorage = new Storage({
          key: 'storage1',
          methods: dummyStorageMethods,
        });
        storages.register(dummyStorage);

        const response = storages.register(dummyStorage1);

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Storage with the key/name 'storage1' already exists",
        );

        expect(storages.storages).toHaveProperty('storage1');
        expect(storages.storages['storage1']).toBe(dummyStorage);
        expect(response).toBeFalsy();
      });

      it('should call updateValue method on all persistent Instances that have the newly registered StorageKey', () => {
        const dummyPersistent1 = new Persistent(dummyAgile, {
          storageKeys: ['storage1'],
        });
        const dummyPersistent2 = new Persistent(dummyAgile, {
          storageKeys: ['notExistingStorage'],
        });
        jest.spyOn(dummyPersistent1, 'persistValue');
        jest.spyOn(dummyPersistent2, 'persistValue');

        const response = storages.register(dummyStorage1);

        expect(dummyPersistent1.persistValue).toHaveBeenCalled();
        expect(dummyPersistent2.persistValue).not.toHaveBeenCalled();
        expect(response).toBeTruthy();
      });

      it('should reassignStorageKeys, revalidate and initialLoad Persistents that have no defined defaultStorage', () => {
        const dummyPersistent1 = new Persistent(dummyAgile);
        dummyPersistent1.defaultStorageKey = undefined;
        const dummyPersistent2 = new Persistent(dummyAgile);
        dummyPersistent2.defaultStorageKey = 'unknown';
        jest.spyOn(dummyPersistent1, 'assignStorageKeys');
        jest
          .spyOn(dummyPersistent1, 'validatePersistent')
          .mockReturnValue(true);
        jest.spyOn(dummyPersistent1, 'initialLoading');
        jest.spyOn(dummyPersistent2, 'assignStorageKeys');
        jest.spyOn(dummyPersistent2, 'validatePersistent');
        jest.spyOn(dummyPersistent2, 'initialLoading');

        const response = storages.register(dummyStorage1);

        expect(dummyPersistent1.assignStorageKeys).toHaveBeenCalled();
        expect(dummyPersistent1.validatePersistent).toHaveBeenCalled();
        expect(dummyPersistent1.initialLoading).toHaveBeenCalled();

        expect(dummyPersistent2.assignStorageKeys).not.toHaveBeenCalled();
        expect(dummyPersistent2.validatePersistent).not.toHaveBeenCalled();
        expect(dummyPersistent2.initialLoading).not.toHaveBeenCalled();

        expect(response).toBeTruthy();
      });
    });

    describe('getStorage function tests', () => {
      beforeEach(() => {
        storages.register(dummyStorage1);
      });

      it('should get existing Storage', () => {
        const response = storages.getStorage('storage1');

        expect(response).toBe(dummyStorage1);
      });

      it("shouldn't get not existing Storage", () => {
        const response = storages.getStorage('notExistingStorage');

        expect(response).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Storage with the key/name 'notExistingStorage' doesn't exist",
        );
      });

      it("shouldn't get existing and not ready Storage", () => {
        dummyStorage1.ready = false;

        const response = storages.getStorage('storage1');

        expect(response).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Storage with the key/name 'storage1' isn't ready",
        );
      });
    });

    describe('get function tests', () => {
      beforeEach(() => {
        storages.register(dummyStorage1);
        storages.register(dummyStorage2);

        dummyStorage1.get = jest.fn(() => 'dummyStorage1Response' as any);
        dummyStorage2.get = jest.fn(() => 'dummyStorage2Response' as any);
      });

      it('should call get method in default Storage', async () => {
        const response = await storages.get('value1');

        expect(response).toBe('dummyStorage1Response');
        expect(dummyStorage1.get).toHaveBeenCalledWith('value1');
        expect(dummyStorage2.get).not.toHaveBeenCalled();
      });

      it('should call get method in specific Storage', async () => {
        const response = await storages.get('value1', 'storage2');

        expect(response).toBe('dummyStorage2Response');
        expect(dummyStorage1.get).not.toHaveBeenCalled();
        expect(dummyStorage2.get).toHaveBeenCalledWith('value1');
      });

      it("should call get method in default Storage if specific Storage doesn't exist", async () => {
        const response = await storages.get('value1', 'notExistingStorage');

        expect(response).toBe('dummyStorage1Response');
        expect(dummyStorage1.get).toHaveBeenCalledWith('value1');
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Storage with the key/name 'notExistingStorage' doesn't exist",
        );
      });

      it('should print error if no storage found', async () => {
        const storages2 = new Storages(dummyAgile);

        const response = await storages2.get('value1');

        expect(response).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
          'Agile Error: No Storage found! Please provide at least one Storage.',
        );
      });
    });

    describe('set function tests', () => {
      beforeEach(() => {
        storages.register(dummyStorage1);
        storages.register(dummyStorage2);
        storages.register(dummyStorage3);

        dummyStorage1.set = jest.fn();
        dummyStorage2.set = jest.fn();
        dummyStorage3.set = jest.fn();
      });

      it('should call set method in default Storage', () => {
        storages.set('value1', 'testValue');

        expect(dummyStorage1.set).toHaveBeenCalledWith('value1', 'testValue');
        expect(dummyStorage2.set).not.toHaveBeenCalled();
        expect(dummyStorage3.set).not.toHaveBeenCalled();
      });

      it('should call set method in specific Storages', () => {
        storages.set('value1', 'testValue', ['storage2', 'storage3']);

        expect(dummyStorage1.set).not.toHaveBeenCalled();
        expect(dummyStorage2.set).toHaveBeenCalledWith('value1', 'testValue');
        expect(dummyStorage3.set).toHaveBeenCalledWith('value1', 'testValue');
      });

      it('should print error if no storage found', () => {
        const storages2 = new Storages(dummyAgile);

        const response = storages2.set('value1', 'testValue');

        expect(response).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
          'Agile Error: No Storage found! Please provide at least one Storage.',
        );
      });
    });

    describe('remove function tests', () => {
      beforeEach(() => {
        storages.register(dummyStorage1);
        storages.register(dummyStorage2);
        storages.register(dummyStorage3);

        dummyStorage1.remove = jest.fn();
        dummyStorage2.remove = jest.fn();
        dummyStorage3.remove = jest.fn();
      });

      it('should call remove method in default Storage', () => {
        storages.remove('value1');

        expect(dummyStorage1.remove).toHaveBeenCalledWith('value1');
        expect(dummyStorage2.remove).not.toHaveBeenCalled();
        expect(dummyStorage3.remove).not.toHaveBeenCalled();
      });

      it('should call remove method in specific Storages', () => {
        storages.remove('value1', ['storage2', 'storage3']);

        expect(dummyStorage1.remove).not.toHaveBeenCalled();
        expect(dummyStorage2.remove).toHaveBeenCalledWith('value1');
        expect(dummyStorage3.remove).toHaveBeenCalledWith('value1');
      });

      it('should print error if no storage found', () => {
        const storages2 = new Storages(dummyAgile);

        const response = storages2.remove('value1');

        expect(response).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
          'Agile Error: No Storage found! Please provide at least one Storage.',
        );
      });
    });

    describe('hasStorage function tests', () => {
      it('should return true if Storages has registered Storages', () => {
        storages.register(dummyStorage1);

        expect(storages.hasStorage()).toBeTruthy();
      });

      it('should return false if Storages has no registered Storage', () => {
        expect(storages.hasStorage()).toBeFalsy();
      });
    });

    describe('localStorageAvailable function tests', () => {
      it('should return true if a instance of local Storage exists', () => {
        global.localStorage = {
          getItem: jest.fn(),
          removeItem: jest.fn(),
          setItem: jest.fn(),
        } as any;

        expect(Storages.localStorageAvailable()).toBeTruthy();
      });

      it('should return false if no instance of localStorage exits', () => {
        global.localStorage = undefined;

        expect(Storages.localStorageAvailable()).toBeFalsy();
      });
    });
  });
});
