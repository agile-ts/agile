import {
  Agile,
  Computed,
  StateRuntimeJob,
  Observer,
  State,
  StateObserver,
  StatePersistent,
  SubscriptionContainer,
} from '../../../src';

describe('StateObserver Tests', () => {
  let dummyAgile: Agile;
  let dummyState: State;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });
    dummyState = new State(dummyAgile, 'dummyValue', { key: 'dummyState' });
  });

  it('should create StateObserver (default config)', () => {
    const stateObserver = new StateObserver(dummyState);

    expect(stateObserver).toBeInstanceOf(StateObserver);
    expect(stateObserver.nextStateValue).toBe('dummyValue');
    expect(stateObserver.state()).toBe(dummyState);
    expect(stateObserver.value).toBe('dummyValue');
    expect(stateObserver._key).toBeUndefined();
    expect(stateObserver.deps.size).toBe(0);
    expect(stateObserver.subs.size).toBe(0);
  });

  it('should create StateObserver (specific config)', () => {
    const dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
    const dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
    const dummySubscription1 = new SubscriptionContainer();
    const dummySubscription2 = new SubscriptionContainer();

    const stateObserver = new StateObserver(dummyState, {
      key: 'testKey',
      deps: [dummyObserver1, dummyObserver2],
      subs: [dummySubscription1, dummySubscription2],
    });

    expect(stateObserver).toBeInstanceOf(StateObserver);
    expect(stateObserver.nextStateValue).toBe('dummyValue');
    expect(stateObserver.state()).toBe(dummyState);
    expect(stateObserver.value).toBe('dummyValue');
    expect(stateObserver._key).toBe('testKey');
    expect(stateObserver.deps.size).toBe(2);
    expect(stateObserver.deps.has(dummyObserver2)).toBeTruthy();
    expect(stateObserver.deps.has(dummyObserver1)).toBeTruthy();
    expect(stateObserver.subs.size).toBe(2);
    expect(stateObserver.subs.has(dummySubscription1)).toBeTruthy();
    expect(stateObserver.subs.has(dummySubscription2)).toBeTruthy();
  });

  describe('StateObserver Function Tests', () => {
    let stateObserver: StateObserver;

    beforeEach(() => {
      stateObserver = new StateObserver(dummyState, {
        key: 'stateObserverKey',
      });
    });

    describe('ingest function tests', () => {
      let computedObserver: StateObserver;
      let dummyComputed: Computed;

      beforeEach(() => {
        dummyComputed = new Computed(
          dummyAgile,
          () => {
            /* empty function */
          },
          {
            key: 'dummyComputed',
          }
        );
        computedObserver = new StateObserver(dummyComputed, {
          key: 'computedObserverKey',
        });

        stateObserver.ingestValue = jest.fn();
        computedObserver.ingestValue = jest.fn();
      });

      it('should call ingestValue with nextStateValue (default config)', () => {
        dummyState.nextStateValue = 'nextValue';

        stateObserver.ingest();

        expect(stateObserver.ingestValue).toHaveBeenCalledWith('nextValue', {});
      });

      it('should call ingestValue with nextStateValue (specific config)', () => {
        dummyState.nextStateValue = 'nextValue';

        stateObserver.ingest({
          force: true,
          key: 'coolKey',
          storage: false,
          sideEffects: false,
          background: true,
          perform: false,
        });

        expect(stateObserver.ingestValue).toHaveBeenCalledWith('nextValue', {
          force: true,
          key: 'coolKey',
          storage: false,
          sideEffects: false,
          background: true,
          perform: false,
        });
      });

      it('should call ingestValue with computedValue if Observer belongs to a ComputedState (default config)', () => {
        dummyComputed.computeValue = jest.fn(() => 'computedValue');

        computedObserver.ingest();

        expect(computedObserver.ingestValue).toHaveBeenCalledWith(
          'computedValue',
          {}
        );
        expect(dummyComputed.computeValue).toHaveBeenCalled();
      });
    });

    describe('ingestValue function tests', () => {
      beforeEach(() => {
        dummyAgile.runtime.ingest = jest.fn();
      });

      it("should ingest State into Runtime if newValue isn't equal to currentValue (default config)", () => {
        dummyAgile.runtime.ingest = jest.fn((job: StateRuntimeJob) => {
          expect(job._key).toBe(stateObserver._key);
          expect(job.observer).toBe(stateObserver);
          expect(job.config).toStrictEqual({
            background: false,
            sideEffects: true,
            force: false,
            storage: true,
            overwrite: false,
          });
        });

        stateObserver.ingestValue('updatedDummyValue');

        expect(stateObserver.nextStateValue).toBe('updatedDummyValue');
        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
          expect.any(StateRuntimeJob),
          {
            perform: true,
          }
        );
      });

      it("should ingest State into Runtime if newValue isn't equal to currentValue (specific config)", () => {
        dummyAgile.runtime.ingest = jest.fn((job: StateRuntimeJob) => {
          expect(job._key).toBe('dummyJob');
          expect(job.observer).toBe(stateObserver);
          expect(job.config).toStrictEqual({
            background: false,
            sideEffects: false,
            force: true,
            storage: true,
            overwrite: true,
          });
        });

        stateObserver.ingestValue('updatedDummyValue', {
          perform: false,
          force: true,
          sideEffects: false,
          overwrite: true,
          key: 'dummyJob',
        });

        expect(stateObserver.nextStateValue).toBe('updatedDummyValue');
        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
          expect.any(StateRuntimeJob),
          {
            perform: false,
          }
        );
      });

      it("shouldn't ingest State into Runtime if newValue is equal to currentValue (default config)", () => {
        dummyState._value = 'updatedDummyValue';

        stateObserver.ingestValue('updatedDummyValue');

        expect(stateObserver.nextStateValue).toBe('updatedDummyValue');
        expect(dummyAgile.runtime.ingest).not.toHaveBeenCalled();
      });

      it('should ingest State into Runtime if newValue is equal to currentValue (config.force = true)', () => {
        dummyState._value = 'updatedDummyValue';
        dummyAgile.runtime.ingest = jest.fn((job: StateRuntimeJob) => {
          expect(job._key).toBe(stateObserver._key);
          expect(job.observer).toBe(stateObserver);
          expect(job.config).toStrictEqual({
            background: false,
            sideEffects: true,
            force: true,
            storage: true,
            overwrite: false,
          });
        });

        stateObserver.ingestValue('updatedDummyValue', { force: true });

        expect(stateObserver.nextStateValue).toBe('updatedDummyValue');
        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
          expect.any(StateRuntimeJob),
          {
            perform: true,
          }
        );
      });

      it('should ingest placeholder State into Runtime (default config)', () => {
        dummyAgile.runtime.ingest = jest.fn((job: StateRuntimeJob) => {
          expect(job._key).toBe(stateObserver._key);
          expect(job.observer).toBe(stateObserver);
          expect(job.config).toStrictEqual({
            background: false,
            sideEffects: true,
            force: true,
            storage: true,
            overwrite: true,
          });
        });
        dummyState.isPlaceholder = true;

        stateObserver.ingestValue('updatedDummyValue');

        expect(stateObserver.nextStateValue).toBe('updatedDummyValue');
        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
          expect.any(StateRuntimeJob),
          {
            perform: true,
          }
        );
      });

      it('should ingest State into Runtime and compute newStateValue if State compute Function is set (default config)', () => {
        dummyState.computeMethod = (value) => `cool value '${value}'`;

        stateObserver.ingestValue('updatedDummyValue');

        expect(stateObserver.nextStateValue).toBe(
          "cool value 'updatedDummyValue'"
        );
        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
          expect.any(StateRuntimeJob),
          {
            perform: true,
          }
        );
      });
    });

    describe('perform function tests', () => {
      let dummyJob: StateRuntimeJob;

      beforeEach(() => {
        dummyJob = new StateRuntimeJob(stateObserver, {
          key: 'dummyJob',
        });
        dummyState.persistent = new StatePersistent(dummyState);
        dummyState.isPersisted = true;

        stateObserver.sideEffects = jest.fn();
      });

      it('should perform Job', () => {
        dummyJob.observer.nextStateValue = 'newValue';
        dummyState.initialStateValue = 'initialValue';
        dummyState._value = 'dummyValue';

        stateObserver.perform(dummyJob);

        expect(dummyState.previousStateValue).toBe('dummyValue');
        expect(dummyState.initialStateValue).toBe('initialValue');
        expect(dummyState._value).toBe('newValue');
        expect(dummyState.nextStateValue).toBe('newValue');
        expect(dummyState.isSet).toBeTruthy();
        expect(stateObserver.value).toBe('newValue');
        expect(stateObserver.sideEffects).toHaveBeenCalledWith(dummyJob);
      });

      it('should perform Job and overwrite State (job.config.overwrite = true)', () => {
        dummyJob.observer.nextStateValue = 'newValue';
        dummyJob.config.overwrite = true;
        dummyState.isPlaceholder = true;
        dummyState.initialStateValue = 'overwriteValue';
        dummyState._value = 'dummyValue';

        stateObserver.perform(dummyJob);

        expect(dummyState.previousStateValue).toBe('newValue');
        expect(dummyState.initialStateValue).toBe('newValue');
        expect(dummyState._value).toBe('newValue');
        expect(dummyState.nextStateValue).toBe('newValue');
        expect(dummyState.isSet).toBeFalsy();
        expect(dummyState.isPlaceholder).toBeFalsy();
        expect(stateObserver.value).toBe('newValue');
        expect(stateObserver.sideEffects).toHaveBeenCalledWith(dummyJob);
      });

      it('should perform Job and set isSet to false if initialStateValue equals to newStateValue', () => {
        dummyJob.observer.nextStateValue = 'newValue';
        dummyState.initialStateValue = 'newValue';
        dummyState._value = 'dummyValue';

        stateObserver.perform(dummyJob);

        expect(dummyState.previousStateValue).toBe('dummyValue');
        expect(dummyState.initialStateValue).toBe('newValue');
        expect(dummyState._value).toBe('newValue');
        expect(dummyState.nextStateValue).toBe('newValue');
        expect(dummyState.isSet).toBeFalsy();
        expect(stateObserver.value).toBe('newValue');
        expect(stateObserver.sideEffects).toHaveBeenCalledWith(dummyJob);
      });
    });

    describe('sideEffects function tests', () => {
      let dummyJob: StateRuntimeJob;
      let dummyStateObserver: StateObserver;

      beforeEach(() => {
        dummyStateObserver = new StateObserver(new State(dummyAgile, 'test'));
        dummyJob = new StateRuntimeJob(stateObserver, {
          key: 'dummyJob',
        });

        dummyState.observer.deps.add(dummyStateObserver);

        dummyState.watchers['dummyWatcher'] = jest.fn();
        dummyState.sideEffects['dummySideEffect'] = jest.fn();
        dummyStateObserver.ingest = jest.fn();
      });

      it('should call watchers, sideEffects and ingest dependencies of State', () => {
        dummyState._value = 'dummyValue';
        stateObserver.sideEffects(dummyJob);

        expect(dummyState.watchers['dummyWatcher']).toHaveBeenCalledWith(
          'dummyValue'
        );
        expect(dummyState.sideEffects['dummySideEffect']).toHaveBeenCalledWith(
          dummyJob.config
        );
        expect(dummyStateObserver.ingest).toHaveBeenCalledWith({
          perform: false,
        });
      });

      it("should call watchers, ingest dependencies of State and shouldn't call sideEffects (job.config.sideEffects = false)", () => {
        dummyState._value = 'dummyValue';
        dummyJob.config.sideEffects = false;
        stateObserver.sideEffects(dummyJob);

        expect(dummyState.watchers['dummyWatcher']).toHaveBeenCalledWith(
          'dummyValue'
        );
        expect(
          dummyState.sideEffects['dummySideEffect']
        ).not.toHaveBeenCalled();
        expect(dummyStateObserver.ingest).toHaveBeenCalledWith({
          perform: false,
        });
      });
    });
  });
});
