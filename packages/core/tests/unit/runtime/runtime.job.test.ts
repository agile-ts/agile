import { Agile, Integration, RuntimeJob, Observer } from '../../../src';
import { LogMock } from '../../helper/logMock';

describe('RuntimeJob Tests', () => {
  let dummyAgile: Agile;
  let dummyIntegration: Integration;
  let dummyObserver: Observer;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile({ localStorage: false });
    dummyIntegration = new Integration({
      key: 'myIntegration',
    });
    dummyObserver = new Observer(dummyAgile);

    jest.clearAllMocks();
  });

  it(
    'should create RuntimeJob ' +
      'with a specified Agile Instance that has a registered Integration (default config)',
    () => {
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
        maxTriesToUpdate: 3,
      });
      expect(job.rerender).toBeTruthy();
      expect(job.performed).toBeFalsy();
      expect(Array.from(job.subscriptionContainersToUpdate)).toStrictEqual([]);
      expect(job.timesTriedToUpdateCount).toBe(0);
      expect(job.timesTriedToUpdateCount).toBe(0);
      expect(job.performed).toBeFalsy();
    }
  );

  it(
    'should create RuntimeJob ' +
      'with a specified Agile Instance that has a registered Integration (specific config)',
    () => {
      dummyAgile.integrate(dummyIntegration);

      const job = new RuntimeJob(dummyObserver, {
        key: 'dummyJob',
        sideEffects: {
          enabled: false,
          exclude: ['jeff'],
        },
        force: true,
        maxTriesToUpdate: 10,
      });

      expect(job._key).toBe('dummyJob');
      expect(job.observer).toBe(dummyObserver);
      expect(job.config).toStrictEqual({
        background: false,
        sideEffects: {
          enabled: false,
          exclude: ['jeff'],
        },
        force: true,
        maxTriesToUpdate: 10,
      });
      expect(job.rerender).toBeTruthy();
      expect(job.performed).toBeFalsy();
      expect(Array.from(job.subscriptionContainersToUpdate)).toStrictEqual([]);
      expect(job.timesTriedToUpdateCount).toBe(0);
      expect(job.performed).toBeFalsy();
    }
  );

  it(
    'should create RuntimeJob ' +
      'with a specified Agile Instance that has no registered Integration (default config)',
    () => {
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
    'should create RuntimeJob ' +
      'with a specified Agile Instance that has a registered Integrations (config.background = true)',
    () => {
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
        maxTriesToUpdate: 3,
      });
      expect(job.rerender).toBeFalsy();
      expect(job.performed).toBeFalsy();
      expect(Array.from(job.subscriptionContainersToUpdate)).toStrictEqual([]);
      expect(job.timesTriedToUpdateCount).toBe(0);
      expect(job.performed).toBeFalsy();
    }
  );

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
