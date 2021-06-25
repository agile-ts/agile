import {
  globalBind,
  getAgileInstance,
  Agile,
  State,
  Observer,
  Collection,
  StateObserver,
  GroupObserver,
} from '../../src';
import * as Utils from '../../src/utils';
import { LogMock } from '../helper/logMock';

describe('Utils Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    LogMock.mockLogs();

    dummyAgile = new Agile({ localStorage: false });

    // @ts-ignore | Reset globalThis
    globalThis = {};
  });

  describe('getAgileInstance function tests', () => {
    beforeEach(() => {
      globalThis[Agile.globalKey] = dummyAgile;
    });

    it('should get agileInstance from State', () => {
      const dummyState = new State(dummyAgile, 'dummyValue');

      expect(getAgileInstance(dummyState)).toBe(dummyAgile);
    });

    it('should get agileInstance from Collection', () => {
      const dummyCollection = new Collection(dummyAgile);

      expect(getAgileInstance(dummyCollection)).toBe(dummyAgile);
    });

    it('should get agileInstance from Observer', () => {
      const dummyObserver = new Observer(dummyAgile);

      expect(getAgileInstance(dummyObserver)).toBe(dummyAgile);
    });

    it('should get agileInstance from globalThis if passed instance holds no agileInstance', () => {
      expect(getAgileInstance('weiredInstance')).toBe(dummyAgile);
    });

    it('should print error if something went wrong', () => {
      // @ts-ignore | Destroy globalThis
      globalThis = undefined;

      const response = getAgileInstance('weiredInstance');

      expect(response).toBeUndefined();
      LogMock.hasLoggedCode('20:03:00', [], 'weiredInstance');
    });
  });

  describe('extractObservers function tests', () => {
    // Observer 1
    let dummyObserver: Observer;

    // Observer 2
    let dummyObserver2: Observer;

    // State with one Observer
    let dummyStateObserver: StateObserver;
    let dummyState: State;

    // State with multiple Observer
    let dummyStateWithMultipleObserver: State;
    let dummyStateValueObserver: StateObserver;
    let dummyStateRandomObserver: StateObserver;

    // Collection
    let dummyCollection: Collection;
    let dummyDefaultGroupValueObserver: StateObserver;
    let dummyDefaultGroupOutputObserver: GroupObserver;

    beforeEach(() => {
      // Observer 1
      dummyObserver = new Observer(dummyAgile);

      // Observer 2
      dummyObserver2 = new Observer(dummyAgile);

      // State with one Observer
      dummyState = new State(dummyAgile, null);
      dummyStateObserver = new StateObserver(dummyState);
      dummyState.observers['value'] = dummyStateObserver;

      // State with multiple Observer
      dummyStateWithMultipleObserver = new State(dummyAgile, null);
      dummyStateValueObserver = new StateObserver(dummyState);
      dummyStateWithMultipleObserver.observers[
        'value'
      ] = dummyStateValueObserver;
      dummyStateRandomObserver = new StateObserver(dummyState);
      dummyStateWithMultipleObserver.observers[
        'random'
      ] = dummyStateRandomObserver;

      // Collection
      dummyCollection = new Collection(dummyAgile);
      const defaultGroup =
        dummyCollection.groups[dummyCollection.config.defaultGroupKey];
      dummyDefaultGroupValueObserver = new StateObserver(defaultGroup);
      defaultGroup.observers['value'] = dummyDefaultGroupValueObserver;
      dummyDefaultGroupOutputObserver = new GroupObserver(defaultGroup);
      defaultGroup.observers['output'] = dummyDefaultGroupOutputObserver;
    });

    it('should extract Observer from specified Instance', () => {
      const response = Utils.extractObservers(dummyState);

      expect(response).toStrictEqual({ value: dummyStateObserver });
    });

    it('should extract Observers from specified Instances', () => {
      const response = Utils.extractObservers([
        // Observer 1
        dummyObserver,

        // State with one Observer
        dummyState,

        undefined,
        {},

        // State with multiple Observer
        dummyStateWithMultipleObserver,

        { observer: 'fake' },

        // Collection
        dummyCollection,

        // Observer 2
        { observer: dummyObserver2 },
      ]);

      expect(response).toStrictEqual([
        // Observer 1
        { value: dummyObserver },

        // State with one Observer
        { value: dummyStateObserver },

        {},
        {},

        // State with multiple Observer
        { value: dummyStateValueObserver, random: dummyStateRandomObserver },

        {},

        // Collection
        {
          value: dummyDefaultGroupValueObserver,
          output: dummyDefaultGroupOutputObserver,
        },

        // Observer 2
        { value: dummyObserver2 },
      ]);
    });
  });

  describe('extractRelevantObservers function tests', () => {
    // State with one Observer
    let dummyStateObserver: StateObserver;
    let dummyState: State;

    // State with multiple Observer
    let dummyStateWithMultipleObserver: State;
    let dummyStateValueObserver: StateObserver;
    let dummyStateRandomObserver: StateObserver;

    // Collection
    let dummyCollection: Collection;
    let dummyDefaultGroupValueObserver: StateObserver;
    let dummyDefaultGroupOutputObserver: GroupObserver;

    beforeEach(() => {
      // State with one Observer
      dummyState = new State(dummyAgile, null);
      dummyStateObserver = new StateObserver(dummyState);
      dummyState.observers['value'] = dummyStateObserver;

      // State with multiple Observer
      dummyStateWithMultipleObserver = new State(dummyAgile, null);
      dummyStateValueObserver = new StateObserver(dummyState);
      dummyStateWithMultipleObserver.observers[
        'value'
      ] = dummyStateValueObserver;
      dummyStateRandomObserver = new StateObserver(dummyState);
      dummyStateWithMultipleObserver.observers[
        'random'
      ] = dummyStateRandomObserver;

      // Collection
      dummyCollection = new Collection(dummyAgile);
      const defaultGroup =
        dummyCollection.groups[dummyCollection.config.defaultGroupKey];
      dummyDefaultGroupValueObserver = new StateObserver(defaultGroup);
      defaultGroup.observers['value'] = dummyDefaultGroupValueObserver;
      dummyDefaultGroupOutputObserver = new GroupObserver(defaultGroup);
      defaultGroup.observers['output'] = dummyDefaultGroupOutputObserver;

      jest.spyOn(Utils, 'extractObservers');
    });

    it('should extract Observers at the specified observerType from the Instances (array shape)', () => {
      const response = Utils.extractRelevantObservers(
        [
          dummyState,
          dummyStateWithMultipleObserver,
          undefined,
          dummyCollection,
        ],
        'output'
      );

      expect(response).toStrictEqual([
        undefined,
        undefined,
        undefined,
        dummyDefaultGroupOutputObserver,
      ]);

      // expect(Utils.extractObservers).toHaveBeenCalledWith(dummyState);
      // expect(Utils.extractObservers).toHaveBeenCalledWith(
      //   dummyStateWithMultipleObserver
      // );
      // expect(Utils.extractObservers).toHaveBeenCalledWith(undefined);
      // expect(Utils.extractObservers).toHaveBeenCalledWith(dummyCollection);
    });

    it('should extract the most relevant Observer from the Instances (array shape)', () => {
      const response = Utils.extractRelevantObservers([
        dummyState,
        dummyStateWithMultipleObserver,
        undefined,
        dummyCollection,
      ]);

      expect(response).toStrictEqual([
        dummyStateObserver,
        dummyStateValueObserver,
        undefined,
        dummyDefaultGroupOutputObserver,
      ]);

      // expect(Utils.extractObservers).toHaveBeenCalledWith(dummyState);
      // expect(Utils.extractObservers).toHaveBeenCalledWith(
      //   dummyStateWithMultipleObserver
      // );
      // expect(Utils.extractObservers).toHaveBeenCalledWith(undefined);
      // expect(Utils.extractObservers).toHaveBeenCalledWith(dummyCollection);
    });

    it('should extract Observers at the specified observerType from the Instances (object shape)', () => {
      const response = Utils.extractRelevantObservers(
        {
          dummyState,
          dummyStateWithMultipleObserver,
          undefinedObserver: undefined,
          dummyCollection,
        },
        'output'
      );

      expect(response).toStrictEqual({
        dummyState: undefined,
        dummyStateWithMultipleObserver: undefined,
        undefinedObserver: undefined,
        dummyCollection: dummyDefaultGroupOutputObserver,
      });

      // expect(Utils.extractObservers).toHaveBeenCalledWith(dummyState);
      // expect(Utils.extractObservers).toHaveBeenCalledWith(
      //   dummyStateWithMultipleObserver
      // );
      // expect(Utils.extractObservers).toHaveBeenCalledWith(undefined);
      // expect(Utils.extractObservers).toHaveBeenCalledWith(dummyCollection);
    });

    it('should extract the most relevant Observer from the Instances (object shape)', () => {
      const response = Utils.extractRelevantObservers({
        dummyState,
        dummyStateWithMultipleObserver,
        undefinedObserver: undefined,
        dummyCollection,
      });

      expect(response).toStrictEqual({
        dummyState: dummyStateObserver,
        dummyStateWithMultipleObserver: dummyStateValueObserver,
        undefinedObserver: undefined,
        dummyCollection: dummyDefaultGroupOutputObserver,
      });

      // expect(Utils.extractObservers).toHaveBeenCalledWith(dummyState);
      // expect(Utils.extractObservers).toHaveBeenCalledWith(
      //   dummyStateWithMultipleObserver
      // );
      // expect(Utils.extractObservers).toHaveBeenCalledWith(undefined);
      // expect(Utils.extractObservers).toHaveBeenCalledWith(dummyCollection);
    });
  });

  describe('globalBind function tests', () => {
    const dummyKey = 'myDummyKey';

    beforeEach(() => {
      globalThis[dummyKey] = undefined;
    });

    it('should bind Instance globally at the specified key (default config)', () => {
      globalBind(dummyKey, 'dummyInstance');

      expect(globalThis[dummyKey]).toBe('dummyInstance');
    });

    it("shouldn't overwrite already globally bound Instance at the same key (default config)", () => {
      globalBind(dummyKey, 'I am first!');

      globalBind(dummyKey, 'dummyInstance');

      expect(globalThis[dummyKey]).toBe('I am first!');
    });

    it('should overwrite already globally bound Instance at the same key (overwrite = true)', () => {
      globalBind(dummyKey, 'I am first!');

      globalBind(dummyKey, 'dummyInstance', true);

      expect(globalThis[dummyKey]).toBe('dummyInstance');
    });

    it('should print error if something went wrong during the bind process', () => {
      // @ts-ignore | Destroy globalThis
      globalThis = undefined;

      globalBind(dummyKey, 'dummyInstance');

      LogMock.hasLoggedCode('20:03:01', [dummyKey]);
    });
  });
});
