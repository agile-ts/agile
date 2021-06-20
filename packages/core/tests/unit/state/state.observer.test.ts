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
import * as Utils from '@agile-ts/utils';
import { LogMock } from '../../helper/logMock';
import waitForExpect from 'wait-for-expect';

describe('StateObserver Tests', () => {
  let dummyAgile: Agile;
  let dummyState: State;

  beforeEach(() => {
    jest.clearAllMocks();
    LogMock.mockLogs();

    dummyAgile = new Agile({ localStorage: false });
    dummyState = new State(dummyAgile, 'dummyValue', { key: 'dummyState' });
  });

  it('should create State Observer (default config)', () => {
    const stateObserver = new StateObserver(dummyState);

    expect(stateObserver).toBeInstanceOf(StateObserver);
    expect(stateObserver.nextStateValue).toBe('dummyValue');
    expect(stateObserver.state()).toBe(dummyState);
    expect(stateObserver.value).toBe('dummyValue');
    expect(stateObserver.previousValue).toBe('dummyValue');
    expect(stateObserver._key).toBeUndefined();
    expect(Array.from(stateObserver.dependents)).toStrictEqual([]);
    expect(Array.from(stateObserver.subscribedTo)).toStrictEqual([]);
  });

  it('should create State Observer (specific config)', () => {
    const dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
    const dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
    const dummySubscription1 = new SubscriptionContainer([]);
    const dummySubscription2 = new SubscriptionContainer([]);

    const stateObserver = new StateObserver(dummyState, {
      key: 'testKey',
      dependents: [dummyObserver1, dummyObserver2],
      subs: [dummySubscription1, dummySubscription2],
    });

    expect(stateObserver).toBeInstanceOf(StateObserver);
    expect(stateObserver.nextStateValue).toBe('dummyValue');
    expect(stateObserver.state()).toBe(dummyState);
    expect(stateObserver.value).toBe('dummyValue');
    expect(stateObserver.previousValue).toBe('dummyValue');
    expect(stateObserver._key).toBe('testKey');
    expect(Array.from(stateObserver.dependents)).toStrictEqual([
      dummyObserver1,
      dummyObserver2,
    ]);
    expect(Array.from(stateObserver.subscribedTo)).toStrictEqual([
      dummySubscription1,
      dummySubscription2,
    ]);
  });

  describe('State Observer Function Tests', () => {
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

      it("should call 'ingestValue' with the 'nextStateValue' (specific config)", () => {
        dummyState.nextStateValue = 'nextValue';

        stateObserver.ingest({
          force: true,
          key: 'coolKey',
          storage: false,
          sideEffects: {
            enabled: false,
          },
          background: true,
          perform: false,
        });

        expect(stateObserver.ingestValue).toHaveBeenCalledWith('nextValue', {
          force: true,
          key: 'coolKey',
          storage: false,
          sideEffects: {
            enabled: false,
          },
          background: true,
          perform: false,
        });
      });

      it(
        "should call 'ingestValue' with computed value " +
          'if Observer belongs to a Computed State (default config)',
        async () => {
          dummyComputed.compute = jest.fn(() =>
            Promise.resolve('computedValue')
          );

          computedObserver.ingest();

          expect(dummyComputed.compute).toHaveBeenCalled();
          await waitForExpect(() => {
            expect(computedObserver.ingestValue).toHaveBeenCalledWith(
              'computedValue',
              {}
            );
          });
        }
      );
    });

    describe('ingestValue function tests', () => {
      beforeEach(() => {
        dummyAgile.runtime.ingest = jest.fn();
      });

      it(
        'should ingest the State into the Runtime ' +
          "if the new value isn't equal to the current value (default config)",
        () => {
          jest.spyOn(Utils, 'generateId').mockReturnValue('randomKey');

          dummyAgile.runtime.ingest = jest.fn((job: StateRuntimeJob) => {
            expect(job._key).toBe(`${stateObserver._key}_randomKey`);
            expect(job.observer).toBe(stateObserver);
            expect(job.config).toStrictEqual({
              background: false,
              sideEffects: {
                enabled: true,
                exclude: [],
              },
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
        }
      );

      it(
        'should ingest the State into the Runtime ' +
          "if the new value isn't equal to the current value (specific config)",
        () => {
          dummyAgile.runtime.ingest = jest.fn((job: StateRuntimeJob) => {
            expect(job._key).toBe('dummyJob');
            expect(job.observer).toBe(stateObserver);
            expect(job.config).toStrictEqual({
              background: false,
              sideEffects: {
                enabled: false,
              },
              force: true,
              storage: true,
              overwrite: true,
            });
          });

          stateObserver.ingestValue('updatedDummyValue', {
            perform: false,
            force: true,
            sideEffects: {
              enabled: false,
            },
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
        }
      );

      it(
        "shouldn't ingest the State into the Runtime " +
          'if the new value is equal to the current value (default config)',
        () => {
          dummyState._value = 'updatedDummyValue';

          stateObserver.ingestValue('updatedDummyValue');

          expect(stateObserver.nextStateValue).toBe('updatedDummyValue');
          expect(dummyAgile.runtime.ingest).not.toHaveBeenCalled();
        }
      );

      it(
        'should ingest the State into the Runtime ' +
          'if the new value is equal to the current value (config.force = true)',
        () => {
          jest.spyOn(Utils, 'generateId').mockReturnValue('randomKey');
          dummyState._value = 'updatedDummyValue';
          dummyAgile.runtime.ingest = jest.fn((job: StateRuntimeJob) => {
            expect(job._key).toBe(`${stateObserver._key}_randomKey`);
            expect(job.observer).toBe(stateObserver);
            expect(job.config).toStrictEqual({
              background: false,
              sideEffects: {
                enabled: true,
                exclude: [],
              },
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
        }
      );

      it('should ingest placeholder State into the Runtime (default config)', () => {
        jest.spyOn(Utils, 'generateId').mockReturnValue('randomKey');
        dummyAgile.runtime.ingest = jest.fn((job: StateRuntimeJob) => {
          expect(job._key).toBe(`${stateObserver._key}_randomKey`);
          expect(job.observer).toBe(stateObserver);
          expect(job.config).toStrictEqual({
            background: false,
            sideEffects: {
              enabled: true,
              exclude: [],
            },
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

      it(
        'should ingest the State into the Runtime and compute the new value ' +
          'if the State compute function is set (default config)',
        () => {
          dummyState.computeValueMethod = (value) => `cool value '${value}'`;

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
        }
      );
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

      it('should perform the specified Job', () => {
        dummyJob.observer.nextStateValue = 'newValue';
        dummyJob.observer.value = 'dummyValue';
        dummyState.initialStateValue = 'initialValue';
        dummyState._value = 'dummyValue';
        dummyState.getPublicValue = jest
          .fn()
          .mockReturnValueOnce('newPublicValue');

        stateObserver.perform(dummyJob);

        expect(dummyState.previousStateValue).toBe('dummyValue');
        expect(dummyState.initialStateValue).toBe('initialValue');
        expect(dummyState._value).toBe('newValue');
        expect(dummyState.nextStateValue).toBe('newValue');
        expect(dummyState.isSet).toBeTruthy();

        expect(stateObserver.value).toBe('newPublicValue');
        expect(stateObserver.previousValue).toBe('dummyValue');
        expect(stateObserver.sideEffects).toHaveBeenCalledWith(dummyJob);
      });

      it('should perform the specified Job and overwrite the State it represents (job.config.overwrite = true)', () => {
        dummyJob.observer.nextStateValue = 'newValue';
        dummyJob.observer.value = 'dummyValue';
        dummyJob.config.overwrite = true;
        dummyState.isPlaceholder = true;
        dummyState.initialStateValue = 'overwriteValue';
        dummyState._value = 'dummyValue';
        dummyState.getPublicValue = jest
          .fn()
          .mockReturnValueOnce('newPublicValue');

        stateObserver.perform(dummyJob);

        expect(dummyState.previousStateValue).toBe('newValue');
        expect(dummyState.initialStateValue).toBe('newValue');
        expect(dummyState._value).toBe('newValue');
        expect(dummyState.nextStateValue).toBe('newValue');
        expect(dummyState.isSet).toBeFalsy();
        expect(dummyState.isPlaceholder).toBeFalsy();

        expect(stateObserver.value).toBe('newPublicValue');
        expect(stateObserver.previousValue).toBe('dummyValue');
        expect(stateObserver.sideEffects).toHaveBeenCalledWith(dummyJob);
      });

      it(
        "should perform the specified Job and set 'isSet' to false " +
          'if the initial State value is equal to the new State value',
        () => {
          dummyJob.observer.nextStateValue = 'newValue';
          dummyJob.observer.value = 'dummyValue';
          dummyState.initialStateValue = 'newValue';
          dummyState._value = 'dummyValue';
          dummyState.getPublicValue = jest
            .fn()
            .mockReturnValueOnce('newPublicValue');

          stateObserver.perform(dummyJob);

          expect(dummyState.previousStateValue).toBe('dummyValue');
          expect(dummyState.initialStateValue).toBe('newValue');
          expect(dummyState._value).toBe('newValue');
          expect(dummyState.nextStateValue).toBe('newValue');
          expect(dummyState.isSet).toBeFalsy();

          expect(stateObserver.value).toBe('newPublicValue');
          expect(stateObserver.previousValue).toBe('dummyValue');
          expect(stateObserver.sideEffects).toHaveBeenCalledWith(dummyJob);
        }
      );
    });

    describe('sideEffects function tests', () => {
      let dummyJob: StateRuntimeJob;
      let sideEffectCallOrder: string[] = [];

      beforeEach(() => {
        sideEffectCallOrder = [];
        dummyJob = new StateRuntimeJob(stateObserver, {
          key: 'dummyJob',
        });

        dummyState.watchers['dummyWatcher'] = jest.fn();
        dummyState.sideEffects['dummySideEffect3'] = {
          weight: 100,
          callback: jest.fn(() => {
            sideEffectCallOrder.push('dummySideEffect3');
          }),
        };
        dummyState.sideEffects['dummySideEffect'] = {
          weight: 10,
          callback: jest.fn(() => {
            sideEffectCallOrder.push('dummySideEffect');
          }),
        };
        dummyState.sideEffects['dummySideEffect2'] = {
          weight: 13,
          callback: jest.fn(() => {
            sideEffectCallOrder.push('dummySideEffect2');
          }),
        };
      });

      it('should call watcher callbacks and State side effect', () => {
        dummyState._value = 'dummyValue';

        stateObserver.sideEffects(dummyJob);

        expect(dummyState.watchers['dummyWatcher']).toHaveBeenCalledWith(
          'dummyValue',
          'dummyWatcher'
        );
        expect(
          dummyState.sideEffects['dummySideEffect'].callback
        ).toHaveBeenCalledWith(dummyState, dummyJob.config);
        expect(
          dummyState.sideEffects['dummySideEffect2'].callback
        ).toHaveBeenCalledWith(dummyState, dummyJob.config);
        expect(
          dummyState.sideEffects['dummySideEffect3'].callback
        ).toHaveBeenCalledWith(dummyState, dummyJob.config);
        expect(sideEffectCallOrder).toStrictEqual([
          'dummySideEffect3',
          'dummySideEffect2',
          'dummySideEffect',
        ]);
      });

      it(
        'should call watcher callbacks ' +
          "and shouldn't call State side effects (job.config.sideEffects.enabled = false)",
        () => {
          dummyState._value = 'dummyValue';
          dummyJob.config.sideEffects = {
            enabled: false,
          };

          stateObserver.sideEffects(dummyJob);

          expect(dummyState.watchers['dummyWatcher']).toHaveBeenCalledWith(
            'dummyValue',
            'dummyWatcher'
          );
          expect(
            dummyState.sideEffects['dummySideEffect'].callback
          ).not.toHaveBeenCalled();
          expect(
            dummyState.sideEffects['dummySideEffect2'].callback
          ).not.toHaveBeenCalled();
          expect(
            dummyState.sideEffects['dummySideEffect3'].callback
          ).not.toHaveBeenCalled();
        }
      );

      it(
        'should call watcher callbacks ' +
          "and shouldn't call all State side effects (job.config.sideEffects.exclude = ['dummySideEffect2'])",
        () => {
          dummyState._value = 'dummyValue';
          dummyJob.config.sideEffects = {
            enabled: true,
            exclude: ['dummySideEffect2'],
          };

          stateObserver.sideEffects(dummyJob);

          expect(dummyState.watchers['dummyWatcher']).toHaveBeenCalledWith(
            'dummyValue',
            'dummyWatcher'
          );
          expect(
            dummyState.sideEffects['dummySideEffect'].callback
          ).toHaveBeenCalledWith(dummyState, dummyJob.config);
          expect(
            dummyState.sideEffects['dummySideEffect2'].callback
          ).not.toHaveBeenCalled();
          expect(
            dummyState.sideEffects['dummySideEffect3'].callback
          ).toHaveBeenCalledWith(dummyState, dummyJob.config);
          expect(sideEffectCallOrder).toStrictEqual([
            'dummySideEffect3',
            'dummySideEffect',
          ]);
        }
      );
    });
  });
});
