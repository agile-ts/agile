import { Agile, Integration, RuntimeJob, Observer } from '../../../src';
import { LogMock } from '../../helper/logMock';

describe('RuntimeJob Tests', () => {
  let dummyAgile: Agile;
  let dummyIntegration: Integration;
  let dummyObserver: Observer;

  beforeEach(() => {
    jest.clearAllMocks();
    LogMock.mockLogs();

    dummyAgile = new Agile({ localStorage: false });
    dummyIntegration = new Integration({
      key: 'myIntegration',
    });
    dummyObserver = new Observer(dummyAgile);
  });

  it('should create RuntimeJob with Agile that has integrations (default config)', () => {
    dummyAgile.integrate(dummyIntegration);

    const job = new RuntimeJob(dummyObserver);

    expect(job._key).toBeUndefined();
    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: false,
      sideEffects: {
        enabled: true,
        exclude: [],
      },
      force: false,
      numberOfTriesToUpdate: 3,
    });
    expect(job.rerender).toBeTruthy();
    expect(job.performed).toBeFalsy();
    expect(job.subscriptionContainersToUpdate.size).toBe(0);
    expect(job.triesToUpdate).toBe(0);
  });

  it('should create RuntimeJob with Agile that has integrations (specific config)', () => {
    dummyAgile.integrate(dummyIntegration);

    const job = new RuntimeJob(dummyObserver, {
      key: 'dummyJob',
      sideEffects: {
        enabled: false,
      },
      force: true,
      numberOfTriesToUpdate: 10,
    });

    expect(job._key).toBe('dummyJob');
    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: false,
      sideEffects: {
        enabled: false,
      },
      force: true,
      numberOfTriesToUpdate: 10,
    });
    expect(job.rerender).toBeTruthy();
    expect(job.performed).toBeFalsy();
    expect(job.subscriptionContainersToUpdate.size).toBe(0);
  });

  it('should create RuntimeJob with Agile that has no integrations (default config)', () => {
    const job = new RuntimeJob(dummyObserver);

    expect(job._key).toBeUndefined();
    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: false,
      sideEffects: {
        enabled: true,
        exclude: [],
      },
      force: false,
      numberOfTriesToUpdate: 3,
    });
    expect(job.rerender).toBeFalsy();
    expect(job.performed).toBeFalsy();
    expect(job.subscriptionContainersToUpdate.size).toBe(0);
  });

  it('should create RuntimeJob and Agile that has integrations (config.background = true)', () => {
    dummyAgile.integrate(dummyIntegration);

    const job = new RuntimeJob(dummyObserver, { background: true });

    expect(job._key).toBeUndefined();
    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: true,
      sideEffects: {
        enabled: true,
        exclude: [],
      },
      force: false,
      numberOfTriesToUpdate: 3,
    });
    expect(job.rerender).toBeFalsy();
    expect(job.performed).toBeFalsy();
    expect(job.subscriptionContainersToUpdate.size).toBe(0);
  });

  describe('RuntimeJob Function Tests', () => {
    let job: RuntimeJob;

    beforeEach(() => {
      job = new RuntimeJob(dummyObserver);
    });

    describe('key get function tests', () => {
      it('should return key of RuntimeJob', () => {
        job._key = 'myCoolKey';

        expect(job.key).toBe('myCoolKey');
      });
    });

    describe('key set function tests', () => {
      it('should update key in RuntimeJob', () => {
        job.key = 'myCoolKey';

        expect(job._key).toBe('myCoolKey');
      });
    });
  });
});
