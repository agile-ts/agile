import {
  State,
  Agile,
  StateObserver,
  Observer,
  ComputedTracker,
} from '../../../src';
import { LogMock } from '../../helper/logMock';

jest.mock('../../../src/state/state.persistent');

describe('State Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile();

    jest.spyOn(State.prototype, 'set');

    jest.clearAllMocks();
  });

  it('should create State and should call initial set (default config)', () => {
    // Overwrite select once to not call it
    jest.spyOn(State.prototype, 'set').mockReturnValueOnce(undefined as any);

    const state = new State(dummyAgile, 'coolValue');

    expect(state.set).toHaveBeenCalledWith('coolValue', { overwrite: true });
    expect(state._key).toBeUndefined();
    expect(state.isSet).toBeFalsy();
    expect(state.isPlaceholder).toBeTruthy();
    expect(state.initialStateValue).toBe('coolValue');
    expect(state._value).toBe('coolValue');
    expect(state.previousStateValue).toBe('coolValue');
    expect(state.nextStateValue).toBe('coolValue');
    expect(state.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(state.observers['value'].dependents)).toStrictEqual([]);
    expect(state.observers['value']._key).toBeUndefined();
    expect(state.sideEffects).toStrictEqual({});
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
    expect(state.observers['value']._key).toBe('coolState');
    expect(state.sideEffects).toStrictEqual({});
  });

  it("should create State and shouldn't call initial set (config.isPlaceholder = true)", () => {
    // Overwrite select once to not call it
    jest.spyOn(State.prototype, 'set').mockReturnValueOnce(undefined as any);

    const state = new State(dummyAgile, 'coolValue', { isPlaceholder: true });

    expect(state.set).not.toHaveBeenCalled();
    expect(state._key).toBeUndefined();
    expect(state.isSet).toBeFalsy();
    expect(state.isPlaceholder).toBeTruthy();
    expect(state.initialStateValue).toBe('coolValue');
    expect(state._value).toBe('coolValue');
    expect(state.previousStateValue).toBe('coolValue');
    expect(state.nextStateValue).toBe('coolValue');
    expect(state.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(state.observers['value'].dependents)).toStrictEqual([]);
    expect(state.observers['value']._key).toBeUndefined();
    expect(state.sideEffects).toStrictEqual({});
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
          numberState.observers['value']
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
      let dummyOutputObserver: Observer;

      beforeEach(() => {
        dummyOutputObserver = new StateObserver(numberState, { key: 'oldKey' });
        numberState.observers['output'] = dummyOutputObserver;
      });

      it('should update existing Key in all instances', () => {
        numberState.setKey('newKey');

        expect(numberState._key).toBe('newKey');
        expect(numberState.observers['value']._key).toBe('newKey');
        expect(numberState.observers['output']._key).toBe('newKey');
      });

      it("should update existing Key in all instances except persistent if the StateKey and PersistKey aren't equal", () => {
        numberState.setKey('newKey');

        expect(numberState._key).toBe('newKey');
        expect(numberState.observers['value']._key).toBe('newKey');
        expect(numberState.observers['output']._key).toBe('newKey');
      });

      it('should update existing Key in all instances except persistent if new StateKey is undefined', () => {
        numberState.setKey(undefined);

        expect(numberState._key).toBeUndefined();
        expect(numberState.observers['value']._key).toBeUndefined();
        expect(numberState.observers['output']._key).toBeUndefined();
      });
    });

    describe('set function tests', () => {
      beforeEach(() => {
        jest.spyOn(numberState.observers['value'], 'ingestValue');
      });

      it('should ingestValue if value has correct type (default config)', () => {
        numberState.set(20);

        LogMock.hasNotLogged('warn');
        LogMock.hasNotLogged('error');
        expect(numberState.observers['value'].ingestValue).toHaveBeenCalledWith(
          20,
          {
            force: false,
          }
        );
      });

      it('should ingestValue if passed function returns value with correct type (default config)', () => {
        numberState.set((value) => value + 20);

        LogMock.hasNotLogged('warn');
        LogMock.hasNotLogged('error');
        expect(numberState.observers['value'].ingestValue).toHaveBeenCalledWith(
          30,
          {
            force: false,
          }
        );
      });

      it('should ingestValue if value has correct type (specific config)', () => {
        numberState.set(20, {
          sideEffects: {
            enabled: false,
          },
          background: true,
          storage: false,
        });

        LogMock.hasNotLogged('warn');
        LogMock.hasNotLogged('error');
        expect(numberState.observers['value'].ingestValue).toHaveBeenCalledWith(
          20,
          {
            sideEffects: {
              enabled: false,
            },
            background: true,
            storage: false,
            force: false,
          }
        );
      });

      it("should ingestValue if value hasn't correct type but the type isn't explicit defined (default config)", () => {
        numberState.set('coolValue' as any);

        LogMock.hasNotLogged('warn');
        LogMock.hasNotLogged('error');
        expect(numberState.observers['value'].ingestValue).toHaveBeenCalledWith(
          'coolValue',
          { force: false }
        );
      });
    });

    describe('ingest function tests', () => {
      beforeEach(() => {
        numberState.observers['value'].ingest = jest.fn();
      });

      it('should call ingest function in Observer (default config)', () => {
        numberState.ingest();

        expect(numberState.observers['value'].ingest).toHaveBeenCalledWith({});
      });

      it('should call ingest function in Observer (specific config)', () => {
        numberState.ingest({
          force: true,
          background: true,
        });

        expect(numberState.observers['value'].ingest).toHaveBeenCalledWith({
          background: true,
          force: true,
        });
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
        LogMock.hasNotLogged('warn');
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
        LogMock.hasNotLogged('warn');
      });

      it("shouldn't add passed invalid function to sideEffects at passed key (default config)", () => {
        numberState.addSideEffect('dummyKey', 10 as any);

        expect(numberState.sideEffects).not.toHaveProperty('dummyKey');
        LogMock.hasLoggedCode('00:03:01', ['Side Effect Callback', 'function']);
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
  });
});
