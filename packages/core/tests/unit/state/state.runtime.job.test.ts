import {
  Agile,
  StateObserver,
  StateRuntimeJob,
  State,
  Integration,
} from '../../../src';
import { LogMock } from '../../helper/logMock';

// jest.mock("../../../src/runtime/runtime.job"); // Can't mock RuntimeJob because mocks get instantiated before everything else -> I got the good old not loaded Object error https://github.com/kentcdodds/how-jest-mocking-works

describe('RuntimeJob Tests', () => {
  let dummyAgile: Agile;
  let dummyIntegration: Integration;
  let dummyState: State;
  let dummyObserver: StateObserver;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile();
    dummyIntegration = new Integration({
      key: 'myIntegration',
    });
    dummyState = new State(dummyAgile, 'dummyValue');
    dummyObserver = new StateObserver(dummyState);

    jest.clearAllMocks();
  });

  it(
    'should create StateRuntimeJob ' +
      'with a specified Agile Instance that has a registered Integration (default config)',
    () => {
      dummyAgile.integrate(dummyIntegration);

      const job = new StateRuntimeJob(dummyObserver);

      expect(job._key).toBeUndefined();
      expect(job.observer).toBe(dummyObserver);
      expect(job.config).toStrictEqual({
        background: false,
        sideEffects: {
          enabled: true,
          exclude: [],
        },
        force: false,
        storage: true,
        overwrite: false,
        maxTriesToUpdate: 3,
      });
      expect(job.rerender).toBeTruthy();
      expect(job.performed).toBeFalsy();
      expect(Array.from(job.subscriptionContainersToUpdate)).toStrictEqual([]);
      expect(job.timesTriedToUpdateCount).toBe(0);
      expect(job.performed).toBeFalsy();
    }
  );

  it(
    'should create StateRuntimeJob ' +
      'with a specified Agile Instance that has a registered Integration (specific config)',
    () => {
      dummyAgile.integrate(dummyIntegration);

      const job = new StateRuntimeJob(dummyObserver, {
        key: 'dummyJob',
        sideEffects: {
          enabled: false,
        },
        force: true,
        maxTriesToUpdate: 5,
      });

      expect(job._key).toBe('dummyJob');
      expect(job.observer).toBe(dummyObserver);
      expect(job.config).toStrictEqual({
        background: false,
        sideEffects: {
          enabled: false,
        },
        force: true,
        storage: true,
        overwrite: false,
        maxTriesToUpdate: 5,
      });
      expect(job.rerender).toBeTruthy();
      expect(job.performed).toBeFalsy();
      expect(Array.from(job.subscriptionContainersToUpdate)).toStrictEqual([]);
      expect(job.timesTriedToUpdateCount).toBe(0);
      expect(job.performed).toBeFalsy();
    }
  );

  it(
    'should create StateRuntimeJob ' +
      'with a specified Agile Instance that has no registered Integration (default config)',
    () => {
      const job = new StateRuntimeJob(dummyObserver);

      expect(job._key).toBeUndefined();
      expect(job.observer).toBe(dummyObserver);
      expect(job.config).toStrictEqual({
        background: false,
        sideEffects: {
          enabled: true,
          exclude: [],
        },
        force: false,
        storage: true,
        overwrite: false,
        maxTriesToUpdate: 3,
      });
      expect(job.rerender).toBeFalsy();
      expect(job.performed).toBeFalsy();
      expect(Array.from(job.subscriptionContainersToUpdate)).toStrictEqual([]);
      expect(job.timesTriedToUpdateCount).toBe(0);
      expect(job.performed).toBeFalsy();
    }
  );

  it(
    'should create StateRuntimeJob ' +
      'with a specified Agile Instance that has a registered Integrations (config.background = true)',
    () => {
      dummyAgile.integrate(dummyIntegration);

      const job = new StateRuntimeJob(dummyObserver, { background: true });

      expect(job._key).toBeUndefined();
      expect(job.observer).toBe(dummyObserver);
      expect(job.config).toStrictEqual({
        background: true,
        sideEffects: {
          enabled: true,
          exclude: [],
        },
        force: false,
        storage: true,
        overwrite: false,
        maxTriesToUpdate: 3,
      });
      expect(job.rerender).toBeFalsy();
      expect(job.performed).toBeFalsy();
      expect(Array.from(job.subscriptionContainersToUpdate)).toStrictEqual([]);
      expect(job.timesTriedToUpdateCount).toBe(0);
      expect(job.performed).toBeFalsy();
    }
  );
});
