import {
  Agile,
  StateObserver,
  StateRuntimeJob,
  State,
  Integration,
} from '../../../src';
import mockConsole from 'jest-mock-console';

// jest.mock("../../../src/runtime/runtime.job"); // Can't mock RuntimeJob because mocks get instantiated before everything else -> I got the good old not loaded Object error https://github.com/kentcdodds/how-jest-mocking-works

describe('RuntimeJob Tests', () => {
  let dummyAgile: Agile;
  let dummyIntegration: Integration;
  let dummyState: State;
  let dummyObserver: StateObserver;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole(['error', 'warn']);

    dummyAgile = new Agile({ localStorage: false });
    dummyIntegration = new Integration({
      key: 'myIntegration',
    });
    dummyState = new State(dummyAgile, 'dummyValue');
    dummyObserver = new StateObserver(dummyState);
  });

  it('should create RuntimeJob with Agile that has integrations (default config)', () => {
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
    });
    expect(job.rerender).toBeTruthy();
    expect(job.performed).toBeFalsy();
    expect(job.subscriptionContainersToUpdate.size).toBe(0);
  });

  it('should create RuntimeJob with Agile that has integrations (specific config)', () => {
    dummyAgile.integrate(dummyIntegration);

    const job = new StateRuntimeJob(dummyObserver, {
      key: 'dummyJob',
      sideEffects: {
        enabled: false,
      },
      force: true,
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
    });
    expect(job.rerender).toBeTruthy();
    expect(job.performed).toBeFalsy();
    expect(job.subscriptionContainersToUpdate.size).toBe(0);
  });

  it('should create RuntimeJob with Agile that has no integrations (default config)', () => {
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
    });
    expect(job.rerender).toBeFalsy();
    expect(job.performed).toBeFalsy();
    expect(job.subscriptionContainersToUpdate.size).toBe(0);
  });

  it('should create RuntimeJob and Agile that has integrations (config.background = true)', () => {
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
    });
    expect(job.rerender).toBeFalsy();
    expect(job.performed).toBeFalsy();
    expect(job.subscriptionContainersToUpdate.size).toBe(0);
  });
});
