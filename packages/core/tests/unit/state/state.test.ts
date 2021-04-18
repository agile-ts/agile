import {
  State,
  Agile,
  StateObserver,
  Observer,
  StatePersistent,
  ComputedTracker,
} from '../../../src';
import * as Utils from '../../../src/utils';
import mockConsole from 'jest-mock-console';

jest.mock('../../../src/state/state.persistent');

describe('State Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole(['error', 'warn']);

    dummyAgile = new Agile({ localStorage: false });

    jest.spyOn(State.prototype, 'set');
  });

  it('should create State and should call initial set (default config)', () => {
    // Overwrite select once to not call it
    jest.spyOn(State.prototype, 'set').mockReturnValueOnce(undefined as any);

    const state = new State(dummyAgile, 'coolValue');

    expect(state.set).toHaveBeenCalledWith('coolValue', { overwrite: true });
    expect(state._key).toBeUndefined();
    expect(state.valueType).toBeUndefined();
    expect(state.isSet).toBeFalsy();
    expect(state.isPlaceholder).toBeTruthy();
    expect(state.initialStateValue).toBe('coolValue');
    expect(state._value).toBe('coolValue');
    expect(state.previousStateValue).toBe('coolValue');
    expect(state.nextStateValue).toBe('coolValue');
    expect(state.observer).toBeInstanceOf(StateObserver);
    expect(state.observer.dependents.size).toBe(0);
    expect(state.observer._key).toBeUndefined();
    expect(state.sideEffects).toStrictEqual({});
    expect(state.computeValueMethod).toBeUndefined();
    expect(state.computeExistsMethod).toBeInstanceOf(Function);
    expect(state.isPersisted).toBeFalsy();
    expect(state.persistent).toBeUndefined();
    expect(state.watchers).toStrictEqual({});
  });

  it('should create State and should call initial set (specific config)', () => {
    // Overwrite select once to not call it
    jest.spyOn(State.prototype, 'set').mockReturnValueOnce(undefined as any);

    const dummyObserver = new Observer(dummyAgile);

    const state = new State(dummyAgile, 'coolValue', {
      key: 'coolState',
      dependents: [dummyObserver],
    });

    expect(state.set).toHaveBeenCalledWith('coolValue', { overwrite: true });
    expect(state._key).toBe('coolState');
    expect(state.valueType).toBeUndefined();
    expect(state.isSet).toBeFalsy();
    expect(state.isPlaceholder).toBeTruthy();
    expect(state.initialStateValue).toBe('coolValue');
    expect(state._value).toBe('coolValue');
    expect(state.previousStateValue).toBe('coolValue');
    expect(state.nextStateValue).toBe('coolValue');
    expect(state.observer).toBeInstanceOf(StateObserver);
    expect(state.observer.dependents.size).toBe(1);
    expect(state.observer.dependents.has(dummyObserver)).toBeTruthy();
    expect(state.observer._key).toBe('coolState');
    expect(state.sideEffects).toStrictEqual({});
    expect(state.computeValueMethod).toBeUndefined();
    expect(state.computeExistsMethod).toBeInstanceOf(Function);
    expect(state.isPersisted).toBeFalsy();
    expect(state.persistent).toBeUndefined();
    expect(state.watchers).toStrictEqual({});
  });

  it("should create State and shouldn't call initial set (config.isPlaceholder = true)", () => {
    // Overwrite select once to not call it
    jest.spyOn(State.prototype, 'set').mockReturnValueOnce(undefined as any);

    const state = new State(dummyAgile, 'coolValue', { isPlaceholder: true });

    expect(state.set).not.toHaveBeenCalled();
    expect(state._key).toBeUndefined();
    expect(state.valueType).toBeUndefined();
    expect(state.isSet).toBeFalsy();
    expect(state.isPlaceholder).toBeTruthy();
    expect(state.initialStateValue).toBe('coolValue');
    expect(state._value).toBe('coolValue');
    expect(state.previousStateValue).toBe('coolValue');
    expect(state.nextStateValue).toBe('coolValue');
    expect(state.observer).toBeInstanceOf(StateObserver);
    expect(state.observer.dependents.size).toBe(0);
    expect(state.observer._key).toBeUndefined();
    expect(state.sideEffects).toStrictEqual({});
    expect(state.computeValueMethod).toBeUndefined();
    expect(state.computeExistsMethod).toBeInstanceOf(Function);
    expect(state.isPersisted).toBeFalsy();
    expect(state.persistent).toBeUndefined();
    expect(state.watchers).toStrictEqual({});
  });

  describe('State Function Tests', () => {
    let numberState: State<number>;
    let objectState: State<{ name: string; age: number }>;
    let arrayState: State<string[]>;
    let booleanState: State<boolean>;

    beforeEach(() => {
      numberState = new State<number>(dummyAgile, 10, {
        key: 'numberStateKey',
      });
      objectState = new State<{ name: string; age: number }>(
        dummyAgile,
        { name: 'jeff', age: 10 },
        {
          key: 'objectStateKey',
        }
      );
      arrayState = new State<string[]>(dummyAgile, ['jeff'], {
        key: 'arrayStateKey',
      });
      booleanState = new State<boolean>(dummyAgile, false, {
        key: 'booleanStateKey',
      });
    });

    describe('value set function tests', () => {
      it('should call set function with passed value', () => {
        numberState.set = jest.fn();

        numberState.value = 20;

        expect(numberState.set).toHaveBeenCalledWith(20);
      });
    });

    describe('value get function tests', () => {
      it('should return current value', () => {
        expect(numberState.value).toBe(10);
        ComputedTracker.tracked = jest.fn();
      });

      it('should return current value', () => {
        const value = numberState.value;

        expect(value).toBe(10);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(
          numberState.observer
        );
      });
    });

    describe('key set function tests', () => {
      it('should call setKey with passed value', () => {
        numberState.setKey = jest.fn();

        numberState.key = 'newKey';

        expect(numberState.setKey).toHaveBeenCalledWith('newKey');
      });
    });

    describe('key get function tests', () => {
      it('should return current State Key', () => {
        expect(numberState.key).toBe('numberStateKey');
      });
    });

    describe('setKey function tests', () => {
      beforeEach(() => {
        numberState.persistent = new StatePersistent(numberState);

        numberState.persistent.setKey = jest.fn();
      });

      it('should update existing Key in all instances', () => {
        if (numberState.persistent)
          numberState.persistent._key = 'numberStateKey';

        numberState.setKey('newKey');

        expect(numberState._key).toBe('newKey');
        expect(numberState.observer._key).toBe('newKey');
        expect(numberState.persistent?.setKey).toHaveBeenCalledWith('newKey');
      });

      it("should update existing Key in all instances except persistent if the StateKey and PersistKey aren't equal", () => {
        if (numberState.persistent) numberState.persistent._key = 'randomKey';

        numberState.setKey('newKey');

        expect(numberState._key).toBe('newKey');
        expect(numberState.observer._key).toBe('newKey');
        expect(numberState.persistent?.setKey).not.toHaveBeenCalled();
      });

      it('should update existing Key in all instances except persistent if new StateKey is undefined', () => {
        if (numberState.persistent)
          numberState.persistent._key = 'numberStateKey';

        numberState.setKey(undefined);

        expect(numberState._key).toBeUndefined();
        expect(numberState.observer._key).toBeUndefined();
        expect(numberState.persistent?.setKey).not.toHaveBeenCalled();
      });
    });

    describe('set function tests', () => {
      beforeEach(() => {
        jest.spyOn(numberState.observer, 'ingestValue');
      });

      it('should ingestValue if value has correct type (default config)', () => {
        numberState.set(20);

        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
        expect(numberState.observer.ingestValue).toHaveBeenCalledWith(20, {
          force: false,
        });
      });

      it('should ingestValue if value has correct type (specific config)', () => {
        numberState.set(20, {
          sideEffects: {
            enabled: false,
          },
          background: true,
          storage: false,
        });

        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
        expect(numberState.observer.ingestValue).toHaveBeenCalledWith(20, {
          sideEffects: {
            enabled: false,
          },
          background: true,
          storage: false,
          force: false,
        });
      });

      it("shouldn't ingestValue if value hasn't correct type (default config)", () => {
        numberState.type(Number);

        numberState.set('coolValue' as any);

        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          'Agile Error: Incorrect type (string) was provided.'
        );
        expect(numberState.observer.ingestValue).not.toHaveBeenCalled();
      });

      it("should ingestValue if value hasn't correct type (config.force = true)", () => {
        numberState.type(Number);

        numberState.set('coolValue' as any, { force: true });

        expect(console.warn).toHaveBeenCalledWith(
          'Agile Warn: Incorrect type (string) was provided.'
        );
        expect(console.error).not.toHaveBeenCalled();
        expect(
          numberState.observer.ingestValue
        ).toHaveBeenCalledWith('coolValue', { force: true });
      });

      it("should ingestValue if value hasn't correct type but the type isn't explicit defined (default config)", () => {
        numberState.set('coolValue' as any);

        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
        expect(
          numberState.observer.ingestValue
        ).toHaveBeenCalledWith('coolValue', { force: false });
      });
    });

    describe('ingest function tests', () => {
      beforeEach(() => {
        numberState.observer.ingest = jest.fn();
      });

      it('should call ingest function in Observer (default config)', () => {
        numberState.ingest();

        expect(numberState.observer.ingest).toHaveBeenCalledWith({});
      });

      it('should call ingest function in Observer (specific config)', () => {
        numberState.ingest({
          force: true,
          background: true,
        });

        expect(numberState.observer.ingest).toHaveBeenCalledWith({
          background: true,
          force: true,
        });
      });
    });

    describe('type function tests', () => {
      it('should assign valid Type to State', () => {
        numberState.type(Number);

        expect(numberState.valueType).toBe('number');
      });

      it("shouldn't assign invalid Type to State", () => {
        numberState.type('fuckingType');

        expect(numberState.valueType).toBeUndefined();
        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: 'fuckingType' is not supported! Supported types: String, Boolean, Array, Object, Number"
        );
      });
    });

    describe('undo function tests', () => {
      beforeEach(() => {
        numberState.set = jest.fn();
      });

      it('should assign previousStateValue to currentValue (default config)', () => {
        numberState.previousStateValue = 99;

        numberState.undo();

        expect(numberState.set).toHaveBeenCalledWith(
          numberState.previousStateValue,
          {}
        );
      });

      it('should assign previousStateValue to currentValue (specific config)', () => {
        numberState.previousStateValue = 99;

        numberState.undo({
          force: true,
          storage: false,
        });

        expect(numberState.set).toHaveBeenCalledWith(
          numberState.previousStateValue,
          {
            force: true,
            storage: false,
          }
        );
      });
    });

    describe('reset function tests', () => {
      beforeEach(() => {
        numberState.set = jest.fn();
      });

      it('should assign initialStateValue to currentValue (default config)', () => {
        numberState.initialStateValue = 99;

        numberState.reset();

        expect(numberState.set).toHaveBeenCalledWith(
          numberState.initialStateValue,
          {}
        );
      });

      it('should assign initialStateValue to currentValue (specific config)', () => {
        numberState.initialStateValue = 99;

        numberState.reset({
          force: true,
          storage: false,
        });

        expect(numberState.set).toHaveBeenCalledWith(
          numberState.initialStateValue,
          {
            force: true,
            storage: false,
          }
        );
      });
    });

    describe('patch function tests', () => {
      beforeEach(() => {
        objectState.ingest = jest.fn();
        numberState.ingest = jest.fn();
        jest.spyOn(Utils, 'flatMerge');
      });

      it("shouldn't patch and ingest passed object based value into a not object based State (default config)", () => {
        numberState.patch({ changed: 'object' });

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: You can't use the patch method on a non object based States!"
        );
        expect(objectState.ingest).not.toHaveBeenCalled();
      });

      it("shouldn't patch and ingest passed not object based value into object based State (default config)", () => {
        objectState.patch('number' as any);

        expect(console.error).toHaveBeenCalledWith(
          'Agile Error: TargetWithChanges has to be an Object!'
        );
        expect(objectState.ingest).not.toHaveBeenCalled();
      });

      it('should patch and ingest passed object based value into a object based State (default config)', () => {
        objectState.patch({ name: 'frank' });

        expect(Utils.flatMerge).toHaveBeenCalledWith(
          { age: 10, name: 'jeff' },
          { name: 'frank' },
          { addNewProperties: true }
        );
        expect(objectState.nextStateValue).toStrictEqual({
          age: 10,
          name: 'frank',
        });
        expect(objectState.ingest).toHaveBeenCalledWith({});
      });

      it('should patch and ingest passed object based value into a object based State (specific config)', () => {
        objectState.patch(
          { name: 'frank' },
          {
            addNewProperties: false,
            background: true,
            force: true,
            overwrite: true,
            sideEffects: {
              enabled: false,
            },
          }
        );

        expect(Utils.flatMerge).toHaveBeenCalledWith(
          { age: 10, name: 'jeff' },
          { name: 'frank' },
          { addNewProperties: false }
        );
        expect(objectState.nextStateValue).toStrictEqual({
          age: 10,
          name: 'frank',
        });
        expect(objectState.ingest).toHaveBeenCalledWith({
          background: true,
          force: true,
          overwrite: true,
          sideEffects: {
            enabled: false,
          },
        });
      });
    });

    describe('watch function tests', () => {
      const dummyCallbackFunction1 = () => {
        /* empty function */
      };
      const dummyCallbackFunction2 = () => {
        /* empty function */
      };

      it('should add passed watcherFunction to watchers at passed key', () => {
        const response = numberState.watch('dummyKey', dummyCallbackFunction1);

        expect(response).toBe(numberState);
        expect(numberState.watchers).toHaveProperty('dummyKey');
        expect(numberState.watchers['dummyKey']).toBe(dummyCallbackFunction1);
      });

      it('should add passed watcherFunction to watchers at random key if no key passed and return that generated key', () => {
        jest.spyOn(Utils, 'generateId').mockReturnValue('randomKey');

        const response = numberState.watch(dummyCallbackFunction1);

        expect(response).toBe('randomKey');
        expect(numberState.watchers).toHaveProperty('randomKey');
        expect(numberState.watchers['randomKey']).toBe(dummyCallbackFunction1);
        expect(Utils.generateId).toHaveBeenCalled();
      });

      it("shouldn't add passed invalid watcherFunction to watchers at passed key", () => {
        const response = numberState.watch(
          'dummyKey',
          'noFunction hehe' as any
        );

        expect(response).toBe(numberState);
        expect(numberState.watchers).not.toHaveProperty('dummyKey');
        expect(console.error).toHaveBeenCalledWith(
          'Agile Error: A Watcher Callback Function has to be typeof Function!'
        );
      });

      it("shouldn't add passed watcherFunction to watchers at passed key if passed key is already occupied", () => {
        numberState.watchers['dummyKey'] = dummyCallbackFunction2;

        const response = numberState.watch('dummyKey', dummyCallbackFunction1);

        expect(response).toBe(numberState);
        expect(numberState.watchers).toHaveProperty('dummyKey');
        expect(numberState.watchers['dummyKey']).toBe(dummyCallbackFunction2);
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Watcher Callback Function with the key/name 'dummyKey' already exists!"
        );
      });
    });

    describe('removeWatcher function tests', () => {
      beforeEach(() => {
        numberState.watchers['dummyKey'] = () => {
          /* empty function */
        };
      });

      it('should remove watcher at key from State', () => {
        numberState.removeWatcher('dummyKey');

        expect(numberState.watchers).not.toHaveProperty('dummyKey');
      });
    });

    describe('onInaugurated function tests', () => {
      let dummyCallbackFunction;

      beforeEach(() => {
        jest.spyOn(numberState, 'watch');
        dummyCallbackFunction = jest.fn();
      });

      it('should add watcher called InauguratedWatcherKey to State', () => {
        numberState.onInaugurated(dummyCallbackFunction);

        expect(numberState.watch).toHaveBeenCalledWith(
          'InauguratedWatcherKey',
          expect.any(Function)
        );
        expect(numberState.watchers).toHaveProperty('InauguratedWatcherKey');
      });

      it('should remove itself after getting called', () => {
        numberState.onInaugurated(dummyCallbackFunction);

        // Call Inaugurated Watcher
        numberState.watchers['InauguratedWatcherKey'](10, 'testKey');

        expect(dummyCallbackFunction).toHaveBeenCalledWith(10, 'testKey');
        expect(numberState.watchers).not.toHaveProperty(
          'InauguratedWatcherKey'
        );
      });
    });

    describe('hasWatcher function tests', () => {
      beforeEach(() => {
        numberState.watchers['dummyKey'] = () => {
          /* empty function */
        };
      });

      it('should return true if Watcher at given Key exists', () => {
        expect(numberState.hasWatcher('dummyKey')).toBeTruthy();
      });

      it("should return false if Watcher at given Key doesn't exists", () => {
        expect(numberState.hasWatcher('notExistingDummyKey')).toBeFalsy();
      });
    });

    describe('persist function tests', () => {
      it('should create persistent with StateKey (default config)', () => {
        numberState.persist();

        expect(numberState.persistent).toBeInstanceOf(StatePersistent);
        expect(StatePersistent).toHaveBeenCalledWith(numberState, {
          instantiate: true,
          storageKeys: [],
          key: numberState._key,
          defaultStorageKey: null,
        });
      });

      it('should create persistent with StateKey (specific config)', () => {
        numberState.persist({
          storageKeys: ['test1', 'test2'],
          loadValue: false,
          defaultStorageKey: 'test1',
        });

        expect(numberState.persistent).toBeInstanceOf(StatePersistent);
        expect(StatePersistent).toHaveBeenCalledWith(numberState, {
          instantiate: false,
          storageKeys: ['test1', 'test2'],
          key: numberState._key,
          defaultStorageKey: 'test1',
        });
      });

      it('should create persistent with passed Key (default config)', () => {
        numberState.persist('passedKey');

        expect(numberState.persistent).toBeInstanceOf(StatePersistent);
        expect(StatePersistent).toHaveBeenCalledWith(numberState, {
          instantiate: true,
          storageKeys: [],
          key: 'passedKey',
          defaultStorageKey: null,
        });
      });

      it('should create persistent with passed Key (specific config)', () => {
        numberState.persist('passedKey', {
          storageKeys: ['test1', 'test2'],
          loadValue: false,
          defaultStorageKey: 'test1',
        });

        expect(numberState.persistent).toBeInstanceOf(StatePersistent);
        expect(StatePersistent).toHaveBeenCalledWith(numberState, {
          instantiate: false,
          storageKeys: ['test1', 'test2'],
          key: 'passedKey',
          defaultStorageKey: 'test1',
        });
      });

      it('should overwrite existing persistent with a warning', () => {
        numberState.persistent = new StatePersistent(numberState);

        numberState.persist('newPersistentKey');

        expect(numberState.persistent).toBeInstanceOf(StatePersistent);
        // expect(numberState.persistent._key).toBe("newPersistentKey"); // Can not test because of Mocking Persistent
        expect(StatePersistent).toHaveBeenCalledWith(numberState, {
          instantiate: true,
          storageKeys: [],
          key: 'newPersistentKey',
          defaultStorageKey: null,
        });
        expect(console.warn).toHaveBeenCalledWith(
          `Agile Warn: By persisting the State '${numberState._key}' twice you overwrite the old Persistent Instance!`
        );
      });
    });

    describe('onLoad function tests', () => {
      const dummyCallbackFunction = jest.fn();

      it("should set onLoad function if State is persisted and shouldn't call it initially (state.isPersisted = false)", () => {
        numberState.persistent = new StatePersistent(numberState);
        numberState.isPersisted = false;

        numberState.onLoad(dummyCallbackFunction);

        expect(numberState.persistent.onLoad).toBe(dummyCallbackFunction);
        expect(dummyCallbackFunction).not.toHaveBeenCalled();
      });

      it('should set onLoad function if State is persisted and should call it initially (state.isPersisted = true)', () => {
        numberState.persistent = new StatePersistent(numberState);
        numberState.isPersisted = true;

        numberState.onLoad(dummyCallbackFunction);

        expect(numberState.persistent.onLoad).toBe(dummyCallbackFunction);
        expect(dummyCallbackFunction).toHaveBeenCalledWith(true);
      });

      it("shouldn't set onLoad function if State isn't persisted and should drop a error", () => {
        numberState.onLoad(dummyCallbackFunction);

        expect(dummyCallbackFunction).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Please make sure you persist the State 'numberStateKey' before using the 'onLoad' function!"
        );
      });
    });

    describe('copy function tests', () => {
      it('should return a reference free copy of the current State Value', () => {
        jest.spyOn(Utils, 'copy');
        const value = numberState.copy();

        expect(value).toBe(10);
        expect(Utils.copy).toHaveBeenCalledWith(10);
      });
    });

    describe('exists get function tests', () => {
      it('should return true if State is no placeholder and computeExistsMethod returns true', () => {
        numberState.computeExistsMethod = jest.fn().mockReturnValueOnce(true);
        numberState.isPlaceholder = false;

        expect(numberState.exists).toBeTruthy();
        expect(numberState.computeExistsMethod).toHaveBeenCalledWith(
          numberState.value
        );
      });

      it('should return false if State is no placeholder and computeExistsMethod returns false', () => {
        numberState.computeExistsMethod = jest.fn().mockReturnValueOnce(false);
        numberState.isPlaceholder = false;

        expect(numberState.exists).toBeFalsy();
        expect(numberState.computeExistsMethod).toHaveBeenCalledWith(
          numberState.value
        );
      });

      it('should return false if State is placeholder"', () => {
        numberState.computeExistsMethod = jest.fn(() => true);
        numberState.isPlaceholder = true;

        expect(numberState.exists).toBeFalsy();
        expect(numberState.computeExistsMethod).not.toHaveBeenCalled(); // since isPlaceholder gets checked first
      });
    });

    describe('computeExists function tests', () => {
      it('should assign passed function to computeExistsMethod', () => {
        const computeMethod = (value) => value === null;

        numberState.computeExists(computeMethod);

        expect(numberState.computeExistsMethod).toBe(computeMethod);
      });

      it("shouldn't assign passed invalid function to computeExistsMethod", () => {
        numberState.computeExists(10 as any);

        expect(numberState.computeExistsMethod).toBeInstanceOf(Function);
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: A 'computeExistsMethod' has to be a function!"
        );
      });
    });

    describe('is function tests', () => {
      beforeEach(() => {
        jest.spyOn(Utils, 'equal');
      });

      it('should return true if passed value is equal to the current StateValue', () => {
        const response = numberState.is(10);

        expect(response).toBeTruthy();
        expect(Utils.equal).toHaveBeenCalledWith(10, numberState._value);
      });

      it('should return false if passed value is not equal to the current StateValue', () => {
        const response = numberState.is(20);

        expect(response).toBeFalsy();
        expect(Utils.equal).toHaveBeenCalledWith(20, numberState._value);
      });
    });

    describe('isNot function tests', () => {
      beforeEach(() => {
        jest.spyOn(Utils, 'notEqual');
      });

      it('should return false if passed value is equal to the current StateValue', () => {
        const response = numberState.isNot(10);

        expect(response).toBeFalsy();
        expect(Utils.notEqual).toHaveBeenCalledWith(10, numberState._value);
      });

      it('should return true if passed value is not equal to the current StateValue', () => {
        const response = numberState.isNot(20);

        expect(response).toBeTruthy();
        expect(Utils.notEqual).toHaveBeenCalledWith(20, numberState._value);
      });
    });

    describe('invert function tests', () => {
      beforeEach(() => {
        numberState.set = jest.fn();
        booleanState.set = jest.fn();
      });

      it('should invert current value of a boolean based State', () => {
        booleanState.invert();

        expect(booleanState.set).toHaveBeenCalledWith(true);
      });

      it("shouldn't invert current value if not boolean based State and should print a error", () => {
        numberState.invert();

        expect(numberState.set).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          'Agile Error: You can only invert boolean based States!'
        );
      });
    });

    describe('computeValue function tests', () => {
      beforeEach(() => {
        numberState.set = jest.fn();
      });

      it('should assign passed function to computeValueMethod and compute State value initially', () => {
        const computeMethod = () => 10;

        numberState.computeValue(computeMethod);

        expect(numberState.set).toHaveBeenCalledWith(10);
        expect(numberState.computeValueMethod).toBe(computeMethod);
      });

      it("shouldn't assign passed invalid function to computeValueMethod", () => {
        numberState.computeValue(10 as any);

        expect(numberState.set).not.toHaveBeenCalled();
        expect(numberState.computeValueMethod).toBeUndefined();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: A 'computeValueMethod' has to be a function!"
        );
      });
    });

    describe('addSideEffect function tests', () => {
      const sideEffectFunction = () => {
        /* empty function */
      };

      it('should add passed callback function to sideEffects at passed key (default config)', () => {
        numberState.addSideEffect('dummyKey', sideEffectFunction);

        expect(numberState.sideEffects).toHaveProperty('dummyKey');
        expect(numberState.sideEffects['dummyKey']).toStrictEqual({
          callback: sideEffectFunction,
          weight: 10,
        });
      });

      it('should add passed callback function to sideEffects at passed key (specific config)', () => {
        numberState.addSideEffect('dummyKey', sideEffectFunction, {
          weight: 999,
        });

        expect(numberState.sideEffects).toHaveProperty('dummyKey');
        expect(numberState.sideEffects['dummyKey']).toStrictEqual({
          callback: sideEffectFunction,
          weight: 999,
        });
      });

      it("shouldn't add passed invalid function to sideEffects at passed key (default config)", () => {
        numberState.addSideEffect('dummyKey', 10 as any);

        expect(numberState.sideEffects).not.toHaveProperty('dummyKey');
        expect(console.error).toHaveBeenCalledWith(
          'Agile Error: A sideEffect function has to be a function!'
        );
      });
    });

    describe('removeSideEffect function tests', () => {
      beforeEach(() => {
        numberState.sideEffects['dummyKey'] = {
          callback: jest.fn(),
          weight: 0,
        };
      });

      it('should remove sideEffect at key from State', () => {
        numberState.removeSideEffect('dummyKey');

        expect(numberState.sideEffects).not.toHaveProperty('dummyKey');
      });
    });

    describe('hasSideEffect function tests', () => {
      beforeEach(() => {
        numberState.sideEffects['dummyKey'] = {
          callback: jest.fn(),
          weight: 0,
        };
      });

      it('should return true if SideEffect at given Key exists', () => {
        expect(numberState.hasSideEffect('dummyKey')).toBeTruthy();
      });

      it("should return false if SideEffect at given Key doesn't exists", () => {
        expect(numberState.hasSideEffect('notExistingDummyKey')).toBeFalsy();
      });
    });

    describe('hasCorrectType function tests', () => {
      it('should return true if State Type matches passed type', () => {
        numberState.type(Number);

        expect(numberState.hasCorrectType(10)).toBeTruthy();
      });

      it("should return false if State Type doesn't matches passed type", () => {
        numberState.type(Number);

        expect(numberState.hasCorrectType('stringValue')).toBeFalsy();
      });

      it('should return true if State has no defined Type', () => {
        expect(numberState.hasCorrectType('stringValue')).toBeTruthy();
      });
    });

    describe('getPublicValue function tests', () => {
      it('should return value of State', () => {
        expect(numberState.getPublicValue()).toBe(10);
      });

      it('should return output of State', () => {
        numberState['output'] = 99;

        expect(numberState.getPublicValue()).toBe(99);
      });
    });
  });
});
