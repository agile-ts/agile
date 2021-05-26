import {
  Computed,
  Agile,
  StateObserver,
  Observer,
  State,
  ComputedTracker,
} from '../../../src';
import { LogMock } from '../../helper/logMock';

describe('Computed Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    LogMock.mockLogs();

    dummyAgile = new Agile({ localStorage: false });

    jest.spyOn(Computed.prototype, 'recompute');
  });

  it('should create Computed (default config)', () => {
    const computedFunction = () => 'computedValue';

    const computed = new Computed(dummyAgile, computedFunction);

    expect(computed.computeFunction).toBe(computedFunction);
    expect(computed.deps).toStrictEqual([]);
    expect(computed.hardCodedDeps).toStrictEqual([]);
    expect(computed._key).toBeUndefined();
    expect(computed.valueType).toBeUndefined();
    expect(computed.isSet).toBeFalsy();
    expect(computed.isPlaceholder).toBeFalsy();
    expect(computed.initialStateValue).toBe('computedValue');
    expect(computed._value).toBe('computedValue');
    expect(computed.previousStateValue).toBe('computedValue');
    expect(computed.nextStateValue).toBe('computedValue');
    expect(computed.observer).toBeInstanceOf(StateObserver);
    expect(computed.observer.dependents.size).toBe(0);
    expect(computed.observer._key).toBeUndefined();
    expect(computed.sideEffects).toStrictEqual({});
    expect(computed.computeValueMethod).toBeUndefined();
    expect(computed.computeExistsMethod).toBeInstanceOf(Function);
    expect(computed.isPersisted).toBeFalsy();
    expect(computed.persistent).toBeUndefined();
    expect(computed.watchers).toStrictEqual({});

    expect(computed.recompute).toHaveBeenCalledWith({ autodetect: true });
  });

  it('should create Computed (specific config)', () => {
    const dummyObserver1 = new Observer(dummyAgile);
    const dummyObserver2 = new Observer(dummyAgile);
    const dummyState = new State(dummyAgile, undefined);
    const dummyStateObserver = new StateObserver(dummyState);
    dummyState.observer = dummyStateObserver;
    const computedFunction = () => 'computedValue';

    const computed = new Computed(dummyAgile, computedFunction, {
      key: 'coolComputed',
      dependents: [dummyObserver1],
      computedDeps: [dummyObserver2, undefined as any, dummyState],
    });

    expect(computed.computeFunction).toBe(computedFunction);
    expect(computed.deps).toStrictEqual([dummyObserver2, dummyStateObserver]); // x
    expect(computed.hardCodedDeps).toStrictEqual([
      dummyObserver2,
      dummyStateObserver,
    ]); // x
    expect(computed._key).toBe('coolComputed'); // x
    expect(computed.valueType).toBeUndefined();
    expect(computed.isSet).toBeFalsy();
    expect(computed.isPlaceholder).toBeFalsy();
    expect(computed.initialStateValue).toBe('computedValue');
    expect(computed._value).toBe('computedValue');
    expect(computed.previousStateValue).toBe('computedValue');
    expect(computed.nextStateValue).toBe('computedValue');
    expect(computed.observer).toBeInstanceOf(StateObserver);
    expect(computed.observer.dependents.size).toBe(1); // x
    expect(computed.observer.dependents.has(dummyObserver1)).toBeTruthy(); // x
    expect(computed.observer._key).toBe('coolComputed'); // x
    expect(computed.sideEffects).toStrictEqual({});
    expect(computed.computeValueMethod).toBeUndefined();
    expect(computed.computeExistsMethod).toBeInstanceOf(Function);
    expect(computed.isPersisted).toBeFalsy();
    expect(computed.persistent).toBeUndefined();
    expect(computed.watchers).toStrictEqual({});

    expect(computed.recompute).toHaveBeenCalledWith({ autodetect: true });
  });

  describe('Computed Function Tests', () => {
    let computed: Computed;
    const dummyComputeFunction = jest.fn(() => 'computedValue');

    beforeEach(() => {
      computed = new Computed(dummyAgile, dummyComputeFunction);
    });

    describe('recompute function tests', () => {
      beforeEach(() => {
        computed.observer.ingestValue = jest.fn();
      });

      it('should ingest Computed into Runtime (default config)', () => {
        computed.compute = jest.fn(() => 'jeff');

        computed.recompute();

        expect(computed.compute).toHaveBeenCalledWith({ autodetect: false });
        expect(computed.observer.ingestValue).toHaveBeenCalledWith('jeff', {});
      });

      it('should ingest Computed into Runtime (specific config)', () => {
        computed.compute = jest.fn(() => 'jeff');

        computed.recompute({
          autodetect: true,
          background: true,
          sideEffects: {
            enabled: false,
          },
          force: false,
          key: 'jeff',
        });

        expect(computed.compute).toHaveBeenCalledWith({ autodetect: true });
        expect(computed.observer.ingestValue).toHaveBeenCalledWith('jeff', {
          background: true,
          sideEffects: {
            enabled: false,
          },
          force: false,
          key: 'jeff',
        });
      });
    });

    describe('updateComputeFunction function tests', () => {
      const newComputeFunction = () => 'newComputedValue';
      let dummyObserver: Observer;
      let oldDummyObserver: Observer;
      let dummyStateObserver: StateObserver;
      let dummyState: State;

      beforeEach(() => {
        dummyObserver = new Observer(dummyAgile);
        oldDummyObserver = new Observer(dummyAgile);
        dummyState = new State(dummyAgile, undefined);
        dummyStateObserver = new StateObserver(dummyState);
        dummyState.observer = dummyStateObserver;
        computed.hardCodedDeps = [oldDummyObserver];
      });

      it('should updated computeFunction and overwrite hardCodedDeps (default config)', () => {
        computed.updateComputeFunction(newComputeFunction, [
          dummyState,
          dummyObserver,
        ]);

        expect(computed.hardCodedDeps).toStrictEqual([
          dummyStateObserver,
          dummyObserver,
        ]);
        expect(computed.deps).toStrictEqual([
          dummyStateObserver,
          dummyObserver,
        ]);
        expect(computed.computeFunction).toBe(newComputeFunction);
        expect(computed.recompute).toHaveBeenCalledWith({ autodetect: true });
      });

      it('should updated computeFunction and overwrite hardCodedDeps (specific config)', () => {
        computed.updateComputeFunction(newComputeFunction, [], {
          background: true,
          sideEffects: {
            enabled: false,
          },
          key: 'jeff',
          force: true,
          autodetect: false,
        });

        expect(computed.hardCodedDeps).toStrictEqual([]);
        expect(computed.deps).toStrictEqual([]);
        expect(computed.computeFunction).toBe(newComputeFunction);
        expect(computed.recompute).toHaveBeenCalledWith({
          background: true,
          sideEffects: {
            enabled: false,
          },
          key: 'jeff',
          force: true,
          autodetect: false,
        });
      });

      it('should updated computeFunction and add additional deps to hardCodedDeps (config.overwriteDeps = false)', () => {
        computed.updateComputeFunction(
          newComputeFunction,
          [dummyState, dummyObserver],
          { overwriteDeps: false }
        );

        expect(computed.hardCodedDeps).toStrictEqual([
          oldDummyObserver,
          dummyStateObserver,
          dummyObserver,
        ]);
        expect(computed.deps).toStrictEqual([
          oldDummyObserver,
          dummyStateObserver,
          dummyObserver,
        ]);
        expect(computed.computeFunction).toBe(newComputeFunction);
        expect(computed.recompute).toHaveBeenCalledWith({ autodetect: true });
      });
    });

    describe('compute function tests', () => {
      let dummyObserver1: Observer;
      let dummyObserver2: Observer;
      let dummyObserver3: Observer;

      beforeEach(() => {
        dummyObserver1 = new Observer(dummyAgile);
        dummyObserver2 = new Observer(dummyAgile);
        dummyObserver3 = new Observer(dummyAgile);

        computed.hardCodedDeps = [dummyObserver3];
        computed.deps = [dummyObserver3]; // normally the hardCodedDeps get automatically added to the deps.. but this time we set the hardCodedProperty after the instantiation

        dummyObserver1.depend = jest.fn();
        dummyObserver2.depend = jest.fn();
        dummyObserver3.depend = jest.fn();
        jest.spyOn(ComputedTracker, 'track').mockClear(); // mockClear because otherwise the static mock doesn't get reset after each 'it' test
        jest.spyOn(ComputedTracker, 'getTrackedObservers').mockClear();
      });

      it('should call computeFunction and track dependencies the computeFunction depends on (default config)', () => {
        jest
          .spyOn(ComputedTracker, 'getTrackedObservers')
          .mockReturnValueOnce([dummyObserver1, dummyObserver2]);
        computed.computeFunction = jest.fn(() => 'newComputedValue');

        const response = computed.compute();

        expect(response).toBe('newComputedValue');
        expect(dummyComputeFunction).toHaveBeenCalled();
        expect(ComputedTracker.track).toHaveBeenCalled();
        expect(ComputedTracker.getTrackedObservers).toHaveBeenCalled();
        expect(computed.hardCodedDeps).toStrictEqual([dummyObserver3]);
        expect(computed.deps).toStrictEqual([
          dummyObserver3,
          dummyObserver1,
          dummyObserver2,
        ]);
        expect(dummyObserver1.depend).toHaveBeenCalledWith(computed.observer);
        expect(dummyObserver2.depend).toHaveBeenCalledWith(computed.observer);
        expect(dummyObserver3.depend).toHaveBeenCalledWith(computed.observer);
      });

      it("should call computeFunction and shouldn't track dependencies the computeFunction depends on (autodetect false)", () => {
        computed.computeFunction = jest.fn(() => 'newComputedValue');

        const response = computed.compute({ autodetect: false });

        expect(response).toBe('newComputedValue');
        expect(dummyComputeFunction).toHaveBeenCalled();
        expect(ComputedTracker.track).not.toHaveBeenCalled();
        expect(ComputedTracker.getTrackedObservers).not.toHaveBeenCalled();
        expect(computed.hardCodedDeps).toStrictEqual([dummyObserver3]);
        expect(computed.deps).toStrictEqual([dummyObserver3]);
        expect(dummyObserver1.depend).not.toHaveBeenCalled();
        expect(dummyObserver2.depend).not.toHaveBeenCalled();
        expect(dummyObserver3.depend).not.toHaveBeenCalled();
      });
    });

    describe('patch function tests', () => {
      it('should print error', () => {
        computed.patch();

        LogMock.hasLoggedCode('19:03:00');
      });
    });

    describe('persist function tests', () => {
      it('should print error', () => {
        computed.persist();

        LogMock.hasLoggedCode('19:03:01');
      });
    });

    describe('invert function tests', () => {
      it('should print error', () => {
        computed.invert();

        LogMock.hasLoggedCode('19:03:02');
      });
    });
  });
});
