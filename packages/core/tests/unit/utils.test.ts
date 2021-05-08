import {
  globalBind,
  getAgileInstance,
  extractObservers,
  Agile,
  State,
  Observer,
  Collection,
  StateObserver,
} from '../../src';
import mockConsole from 'jest-mock-console';

describe('Utils Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole(['error', 'warn']);

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
      expect(console.error).toHaveBeenCalledWith(
        'Agile Error: Failed to get Agile Instance from ',
        'weiredInstance'
      );
    });
  });

  describe('extractObservers function tests', () => {
    let dummyObserver: Observer;
    let dummyObserver2: Observer;
    let dummyStateObserver: StateObserver;
    let dummyState: State;
    let dummyDefaultGroupObserver: StateObserver;
    let dummyCollection: Collection;

    beforeEach(() => {
      dummyObserver = new Observer(dummyAgile);
      dummyObserver2 = new Observer(dummyAgile);

      dummyState = new State(dummyAgile, undefined);
      dummyStateObserver = new StateObserver(dummyState);
      dummyState.observer = dummyStateObserver;

      dummyCollection = new Collection(dummyAgile);
      const defaultGroup =
        dummyCollection.groups[dummyCollection.config.defaultGroupKey];
      dummyDefaultGroupObserver = new StateObserver(defaultGroup);
      defaultGroup.observer = dummyDefaultGroupObserver;
    });

    it('should extract Observers from passed Instances', () => {
      const response = extractObservers([
        dummyObserver,
        dummyState,
        undefined,
        {},
        { observer: 'fake' },
        dummyCollection,
        { observer: dummyObserver2 },
      ]);

      expect(response).toStrictEqual([
        dummyObserver,
        dummyStateObserver,
        undefined,
        undefined,
        undefined,
        dummyDefaultGroupObserver,
        dummyObserver2,
      ]);
    });
  });

  describe('globalBind function tests', () => {
    const dummyKey = 'myDummyKey';

    beforeEach(() => {
      globalThis[dummyKey] = undefined;
    });

    it('should bind instance at key globally (default config)', () => {
      globalBind(dummyKey, 'dummyInstance');

      expect(globalThis[dummyKey]).toBe('dummyInstance');
    });

    it("shouldn't overwrite already existing instance at key (default config)", () => {
      globalBind(dummyKey, 'I am first!');

      globalBind(dummyKey, 'dummyInstance');

      expect(globalThis[dummyKey]).toBe('I am first!');
    });

    it('should overwrite already existing instance at key (overwrite = true)', () => {
      globalBind(dummyKey, 'I am first!');

      globalBind(dummyKey, 'dummyInstance', true);

      expect(globalThis[dummyKey]).toBe('dummyInstance');
    });

    it('should print error if something went wrong during the bind process', () => {
      // @ts-ignore | Destroy globalThis
      globalThis = undefined;

      globalBind(dummyKey, 'dummyInstance');

      expect(console.error).toHaveBeenCalledWith(
        `Agile Error: Failed to create global Instance called '${dummyKey}'`
      );
    });
  });
});
