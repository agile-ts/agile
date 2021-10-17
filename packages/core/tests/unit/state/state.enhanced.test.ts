import {
  State,
  Agile,
  StateObserver,
  Observer,
  StatePersistent,
  EnhancedState,
} from '../../../src';
import * as Utils from '@agile-ts/utils';
import { LogMock } from '../../helper/logMock';

jest.mock('../../../src/state/state.persistent');

describe('Enhanced State Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile();

    jest.spyOn(State.prototype, 'set');

    jest.clearAllMocks();
  });

  it('should create Enhanced State and should call initial set (default config)', () => {
    // Overwrite select once to not call it
    jest
      .spyOn(EnhancedState.prototype, 'set')
      .mockReturnValueOnce(undefined as any);

    const state = new EnhancedState(dummyAgile, 'coolValue');

    expect(state.isPersisted).toBeFalsy();
    expect(state.persistent).toBeUndefined();
    expect(state.computeValueMethod).toBeUndefined();
    expect(state.computeExistsMethod).toBeInstanceOf(Function);
    expect(state.currentInterval).toBeUndefined();

    // Check if State was called with correct parameters
    expect(state._key).toBeUndefined();
    expect(state.isSet).toBeFalsy();
    expect(state.isPlaceholder).toBeTruthy();
    expect(state.initialStateValue).toBe('coolValue');
    expect(state._value).toBe('coolValue');
    expect(state.previousStateValue).toBe('coolValue');
    expect(state.nextStateValue).toBe('coolValue');
    expect(state.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(state.observers['value'].dependents)).toStrictEqual([]);
    expect(state.observers['value'].key).toBeUndefined();
    expect(state.sideEffects).toStrictEqual({});
  });

  it('should create Enhanced State  and should call initial set (specific config)', () => {
    // Overwrite select once to not call it
    jest
      .spyOn(EnhancedState.prototype, 'set')
      .mockReturnValueOnce(undefined as any);

    const dummyObserver = new Observer(dummyAgile);

    const state = new EnhancedState(dummyAgile, 'coolValue', {
      key: 'coolState',
      dependents: [dummyObserver],
    });

    expect(state.isPersisted).toBeFalsy();
    expect(state.persistent).toBeUndefined();
    expect(state.computeValueMethod).toBeUndefined();
    expect(state.computeExistsMethod).toBeInstanceOf(Function);
    expect(state.currentInterval).toBeUndefined();

    // Check if State was called with correct parameters
    expect(state._key).toBe('coolState');
    expect(state.isSet).toBeFalsy();
    expect(state.isPlaceholder).toBeTruthy();
    expect(state.initialStateValue).toBe('coolValue');
    expect(state._value).toBe('coolValue');
    expect(state.previousStateValue).toBe('coolValue');
    expect(state.nextStateValue).toBe('coolValue');
    expect(state.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(state.observers['value'].dependents)).toStrictEqual([
      dummyObserver,
    ]);
    expect(state.observers['value'].key).toBe('coolState');
    expect(state.sideEffects).toStrictEqual({});
  });

  it("should create Enhanced State and shouldn't call initial set (config.isPlaceholder = true)", () => {
    // Overwrite select once to not call it
    jest
      .spyOn(EnhancedState.prototype, 'set')
      .mockReturnValueOnce(undefined as any);

    const state = new EnhancedState(dummyAgile, 'coolValue', {
      isPlaceholder: true,
    });

    expect(state.isPersisted).toBeFalsy();
    expect(state.persistent).toBeUndefined();
    expect(state.computeValueMethod).toBeUndefined();
    expect(state.computeExistsMethod).toBeInstanceOf(Function);
    expect(state.currentInterval).toBeUndefined();

    // Check if State was called with correct parameters
    expect(state._key).toBeUndefined();
    expect(state.isSet).toBeFalsy();
    expect(state.isPlaceholder).toBeTruthy();
    expect(state.initialStateValue).toBe('coolValue');
    expect(state._value).toBe('coolValue');
    expect(state.previousStateValue).toBe('coolValue');
    expect(state.nextStateValue).toBe('coolValue');
    expect(state.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(state.observers['value'].dependents)).toStrictEqual([]);
    expect(state.observers['value'].key).toBeUndefined();
    expect(state.sideEffects).toStrictEqual({});
  });

  describe('State Function Tests', () => {
    let numberState: EnhancedState<number>;
    let objectState: EnhancedState<{ name: string; age: number }>;
    let arrayState: EnhancedState<string[]>;
    let booleanState: EnhancedState<boolean>;

    beforeEach(() => {
      numberState = new EnhancedState<number>(dummyAgile, 10, {
        key: 'numberStateKey',
      });
      objectState = new EnhancedState<{ name: string; age: number }>(
        dummyAgile,
        { name: 'jeff', age: 10 },
        {
          key: 'objectStateKey',
        }
      );
      arrayState = new EnhancedState<string[]>(dummyAgile, ['jeff'], {
        key: 'arrayStateKey',
      });
      booleanState = new EnhancedState<boolean>(dummyAgile, false, {
        key: 'booleanStateKey',
      });
    });

    describe('setKey function tests', () => {
      beforeEach(() => {
        numberState.persistent = new StatePersistent(numberState);

        numberState.persistent.setKey = jest.fn();
        jest.spyOn(State.prototype, 'setKey');
      });

      it("should call 'setKey()' in the State and update the Persistent key", () => {
        if (numberState.persistent)
          numberState.persistent._key = numberState._key as any;

        numberState.setKey('newKey');

        expect(State.prototype.setKey).toHaveBeenCalledWith('newKey');
        expect(numberState.persistent?.setKey).toHaveBeenCalledWith('newKey');
      });

      it(
        "should call 'setKey()' in the State " +
          "and shouldn't update the Persistent key if the specified StateKey and PersistKey differentiate",
        () => {
          if (numberState.persistent) numberState.persistent._key = 'randomKey';

          numberState.setKey('newKey');

          expect(State.prototype.setKey).toHaveBeenCalledWith('newKey');
          expect(numberState.persistent?.setKey).not.toHaveBeenCalled();
        }
      );

      it(
        "should call 'setKey()' in the State " +
          "and shouldn't update the Persistent key if the specified StateKey is undefined",
        () => {
          if (numberState.persistent)
            numberState.persistent._key = numberState._key as any;

          numberState.setKey(undefined);

          expect(State.prototype.setKey).toHaveBeenCalledWith(undefined);
          expect(numberState.persistent?.setKey).not.toHaveBeenCalled();
        }
      );
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
        arrayState.ingest = jest.fn();
        jest.spyOn(Utils, 'flatMerge');
      });

      it("shouldn't patch specified object value into a not object based State (default config)", () => {
        numberState.patch({ changed: 'object' });

        LogMock.hasLoggedCode('14:03:02');
        expect(objectState.ingest).not.toHaveBeenCalled();
      });

      it("shouldn't patch specified non object value into a object based State (default config)", () => {
        objectState.patch('number' as any);

        LogMock.hasLoggedCode('00:03:01', ['TargetWithChanges', 'object']);
        expect(objectState.ingest).not.toHaveBeenCalled();
      });

      it('should patch specified object value into a object based State (default config)', () => {
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
        expect(objectState.ingest).toHaveBeenCalledWith({
          addNewProperties: true, // Not required but passed for simplicity
        });
      });

      it('should patch specified object value into a object based State (specific config)', () => {
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
          addNewProperties: false, // Not required but passed for simplicity
        });
      });

      it('should patch specified array value into a array based State (default config)', () => {
        arrayState.patch(['hi']);

        expect(Utils.flatMerge).not.toHaveBeenCalled();
        expect(arrayState.nextStateValue).toStrictEqual(['jeff', 'hi']);
        expect(arrayState.ingest).toHaveBeenCalledWith({
          addNewProperties: true, // Not required but passed for simplicity
        });
      });

      it('should patch specified array value into a object based State', () => {
        objectState.patch(['hi'], { addNewProperties: true });

        expect(Utils.flatMerge).toHaveBeenCalledWith(
          { age: 10, name: 'jeff' },
          ['hi'],
          { addNewProperties: true }
        );
        expect(objectState.nextStateValue).toStrictEqual({
          0: 'hi',
          age: 10,
          name: 'jeff',
        });
        expect(objectState.ingest).toHaveBeenCalledWith({
          addNewProperties: true, // Not required but passed for simplicity
        });
      });
    });

    describe('watch function tests', () => {
      let dummyCallbackFunction;

      beforeEach(() => {
        jest.spyOn(numberState, 'addSideEffect');
        dummyCallbackFunction = jest.fn();
      });

      it('should add passed watcherFunction to watchers at passed key', () => {
        const response = numberState.watch('dummyKey', dummyCallbackFunction);

        expect(response).toBe(numberState);
        expect(numberState.addSideEffect).toHaveBeenCalledWith(
          'dummyKey',
          expect.any(Function),
          { weight: 0 }
        );

        // Test whether registered callback function is called
        numberState.sideEffects['dummyKey'].callback(numberState);
        expect(dummyCallbackFunction).toHaveBeenCalledWith(
          numberState._value,
          'dummyKey'
        );
      });

      it('should add passed watcherFunction to watchers at random key if no key passed and return that generated key', () => {
        jest.spyOn(Utils, 'generateId').mockReturnValue('randomKey');

        const response = numberState.watch(dummyCallbackFunction);

        expect(response).toBe('randomKey');
        expect(numberState.addSideEffect).toHaveBeenCalledWith(
          'randomKey',
          expect.any(Function),
          { weight: 0 }
        );
        expect(Utils.generateId).toHaveBeenCalled();

        // Test whether registered callback function is called
        numberState.sideEffects['randomKey'].callback(numberState);
        expect(dummyCallbackFunction).toHaveBeenCalledWith(
          numberState._value,
          'randomKey'
        );
      });

      it("shouldn't add passed invalid watcherFunction to watchers at passed key", () => {
        const response = numberState.watch(
          'dummyKey',
          'noFunction hehe' as any
        );

        expect(response).toBe(numberState);
        expect(numberState.addSideEffect).not.toHaveBeenCalled();
        LogMock.hasLoggedCode('00:03:01', ['Watcher Callback', 'function']);
      });
    });

    describe('removeWatcher function tests', () => {
      beforeEach(() => {
        jest.spyOn(numberState, 'removeSideEffect');
      });

      it('should remove watcher at key from State', () => {
        numberState.removeWatcher('dummyKey');

        expect(numberState.removeSideEffect).toHaveBeenCalledWith('dummyKey');
      });
    });

    describe('onInaugurated function tests', () => {
      let dummyCallbackFunction;

      beforeEach(() => {
        jest.spyOn(numberState, 'watch');
        jest.spyOn(numberState, 'removeSideEffect');
        dummyCallbackFunction = jest.fn();
      });

      it('should add watcher called InauguratedWatcherKey to State', () => {
        numberState.onInaugurated(dummyCallbackFunction);

        expect(numberState.watch).toHaveBeenCalledWith(
          'InauguratedWatcherKey',
          expect.any(Function)
        );
      });

      it('should remove itself after invoking', () => {
        numberState.onInaugurated(dummyCallbackFunction);

        // Call Inaugurated Watcher
        numberState.sideEffects['InauguratedWatcherKey'].callback(numberState);

        expect(dummyCallbackFunction).toHaveBeenCalledWith(
          numberState.value,
          'InauguratedWatcherKey'
        );
        expect(numberState.removeSideEffect).toHaveBeenCalledWith(
          'InauguratedWatcherKey'
        );
      });
    });

    describe('persist function tests', () => {
      it('should create Persistent (default config)', () => {
        numberState.persist();

        expect(numberState.persistent).toBeInstanceOf(StatePersistent);
        expect(StatePersistent).toHaveBeenCalledWith(numberState, {
          key: numberState._key,
        });
      });

      it('should create Persistent (specific config)', () => {
        numberState.persist({
          key: 'specificKey',
          storageKeys: ['test1', 'test2'],
          loadValue: false,
          defaultStorageKey: 'test1',
        });

        expect(numberState.persistent).toBeInstanceOf(StatePersistent);
        expect(StatePersistent).toHaveBeenCalledWith(numberState, {
          loadValue: false,
          storageKeys: ['test1', 'test2'],
          key: 'specificKey',
          defaultStorageKey: 'test1',
        });
      });

      it("shouldn't overwrite existing Persistent", () => {
        const dummyPersistent = new StatePersistent(numberState);
        numberState.persistent = dummyPersistent;
        numberState.isPersisted = true;
        jest.clearAllMocks();

        numberState.persist({ key: 'newPersistentKey' });

        expect(numberState.persistent).toBe(dummyPersistent);
        // expect(numberState.persistent._key).toBe("newPersistentKey"); // Can not test because of Mocking Persistent
        expect(StatePersistent).not.toHaveBeenCalled();
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
        LogMock.hasNotLogged('warn');
      });

      it('should set onLoad function if State is persisted and should call it initially (state.isPersisted = true)', () => {
        numberState.persistent = new StatePersistent(numberState);
        numberState.isPersisted = true;

        numberState.onLoad(dummyCallbackFunction);

        expect(numberState.persistent.onLoad).toBe(dummyCallbackFunction);
        expect(dummyCallbackFunction).toHaveBeenCalledWith(true);
        LogMock.hasNotLogged('warn');
      });

      it("shouldn't set onLoad function if State isn't persisted", () => {
        numberState.onLoad(dummyCallbackFunction);

        expect(numberState?.persistent?.onLoad).toBeUndefined();
        expect(dummyCallbackFunction).not.toHaveBeenCalled();
        LogMock.hasNotLogged('warn');
      });

      it("shouldn't set invalid onLoad callback function", () => {
        numberState.persistent = new StatePersistent(numberState);
        numberState.isPersisted = false;

        numberState.onLoad(10 as any);

        expect(numberState?.persistent?.onLoad).toBeUndefined();
        LogMock.hasLoggedCode('00:03:01', ['OnLoad Callback', 'function']);
      });
    });

    describe('interval function tests', () => {
      const dummyCallbackFunction = jest.fn();
      const dummyCallbackFunction2 = jest.fn();

      beforeEach(() => {
        jest.useFakeTimers();
        numberState.set = jest.fn();
      });

      afterEach(() => {
        jest.clearAllTimers();
      });

      it('should create an interval (without custom milliseconds)', () => {
        dummyCallbackFunction.mockReturnValueOnce(10);

        numberState.interval(dummyCallbackFunction);

        jest.runTimersToTime(1000); // travel 1000s in time -> execute interval

        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenLastCalledWith(
          expect.any(Function),
          1000
        );
        expect(dummyCallbackFunction).toHaveBeenCalledWith(numberState._value);
        expect(numberState.set).toHaveBeenCalledWith(10);
        expect(numberState.currentInterval).toEqual({
          id: expect.anything(),
          ref: expect.anything(),
          unref: expect.anything(),
        });
        LogMock.hasNotLogged('warn');
      });

      it('should create an interval (with custom milliseconds)', () => {
        dummyCallbackFunction.mockReturnValueOnce(10);

        numberState.interval(dummyCallbackFunction, 2000);

        jest.runTimersToTime(2000); // travel 2000 in time -> execute interval

        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenLastCalledWith(
          expect.any(Function),
          2000
        );
        expect(dummyCallbackFunction).toHaveBeenCalledWith(numberState._value);
        expect(numberState.set).toHaveBeenCalledWith(10);
        expect(numberState.currentInterval).toEqual({
          id: expect.anything(),
          ref: expect.anything(),
          unref: expect.anything(),
        });
        LogMock.hasNotLogged('warn');
      });

      it("shouldn't be able to create second interval and print warning", () => {
        numberState.interval(dummyCallbackFunction, 3000);
        const currentInterval = numberState.currentInterval;
        numberState.interval(dummyCallbackFunction2);

        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenLastCalledWith(
          expect.any(Function),
          3000
        );
        expect(numberState.currentInterval).toStrictEqual(currentInterval);
        LogMock.hasLoggedCode('14:03:03', [], numberState.currentInterval);
      });

      it("shouldn't set invalid interval callback function", () => {
        numberState.interval(10 as any);

        expect(setInterval).not.toHaveBeenCalled();
        expect(numberState.currentInterval).toBeUndefined();
        LogMock.hasLoggedCode('00:03:01', ['Interval Callback', 'function']);
      });
    });

    describe('clearInterval function tests', () => {
      const dummyCallbackFunction = jest.fn();

      beforeEach(() => {
        jest.useFakeTimers();
        numberState.set = jest.fn();
      });

      afterEach(() => {
        jest.clearAllTimers();
      });

      it('should clear existing interval', () => {
        numberState.interval(dummyCallbackFunction);
        const currentInterval = numberState.currentInterval;

        numberState.clearInterval();

        expect(clearInterval).toHaveBeenCalledTimes(1);
        expect(clearInterval).toHaveBeenLastCalledWith(currentInterval);
        expect(numberState.currentInterval).toBeUndefined();
      });

      it("shouldn't clear not existing interval", () => {
        numberState.clearInterval();

        expect(clearInterval).not.toHaveBeenCalled();
        expect(numberState.currentInterval).toBeUndefined();
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
        LogMock.hasNotLogged('warn');
      });

      it("shouldn't assign passed invalid function to computeExistsMethod", () => {
        numberState.computeExists(10 as any);

        expect(numberState.computeExistsMethod).toBeInstanceOf(Function);
        LogMock.hasLoggedCode('00:03:01', [
          'Compute Exists Method',
          'function',
        ]);
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
      let dummyState: EnhancedState;

      beforeEach(() => {
        dummyState = new EnhancedState(dummyAgile, null);

        dummyState.set = jest.fn();
      });

      it('should invert value of the type boolean', () => {
        dummyState.nextStateValue = false;

        dummyState.invert();

        expect(dummyState.set).toHaveBeenCalledWith(true);
      });

      it('should invert value of the type number', () => {
        dummyState.nextStateValue = 10;

        dummyState.invert();

        expect(dummyState.set).toHaveBeenCalledWith(-10);
      });

      it('should invert value of the type array', () => {
        dummyState.nextStateValue = ['1', '2', '3'];

        dummyState.invert();

        expect(dummyState.set).toHaveBeenCalledWith(['3', '2', '1']);
      });

      it('should invert value of the type string', () => {
        dummyState.nextStateValue = 'jeff';

        dummyState.invert();

        expect(dummyState.set).toHaveBeenCalledWith('ffej');
      });

      it("shouldn't invert not invertible types like function, null, undefined, object", () => {
        dummyState.nextStateValue = () => {
          // empty
        };

        dummyState.invert();

        expect(dummyState.set).not.toHaveBeenCalled();
        LogMock.hasLoggedCode('14:03:04', ['function']);
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
        LogMock.hasNotLogged('warn');
      });

      it("shouldn't assign passed invalid function to computeValueMethod", () => {
        numberState.computeValue(10 as any);

        expect(numberState.set).not.toHaveBeenCalled();
        expect(numberState.computeValueMethod).toBeUndefined();
        LogMock.hasLoggedCode('00:03:01', ['Compute Value Method', 'function']);
      });
    });
  });
});
