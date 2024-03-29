import {
  Observer,
  Agile,
  SubscriptionContainer,
  RuntimeJob,
} from '../../../src';
import * as Utils from '@agile-ts/utils';
import { LogMock } from '../../helper/logMock';

describe('Observer Tests', () => {
  let dummyAgile: Agile;
  let dummyObserver1: Observer;
  let dummyObserver2: Observer;
  let dummySubscription1: SubscriptionContainer;
  let dummySubscription2: SubscriptionContainer;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile();
    dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
    dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
    dummySubscription1 = new SubscriptionContainer([]);
    dummySubscription2 = new SubscriptionContainer([]);

    jest.spyOn(dummySubscription1, 'addSubscription');
    jest.spyOn(dummySubscription2, 'addSubscription');

    jest.clearAllMocks();
  });

  it('should create Observer (default config)', () => {
    const observer = new Observer(dummyAgile);

    expect(observer.agileInstance()).toBe(dummyAgile);
    expect(observer.key).toBeUndefined();
    expect(Array.from(observer.dependents)).toStrictEqual([]);
    expect(Array.from(observer.subscribedTo)).toStrictEqual([]);
    expect(observer.value).toBeNull();
    expect(observer.previousValue).toBeNull();
  });

  it('should create Observer (specific config)', () => {
    const observer = new Observer(dummyAgile, {
      key: 'testKey',
      subs: [dummySubscription1, dummySubscription2],
      dependents: [dummyObserver1, dummyObserver2],
      value: 'coolValue',
    });

    expect(observer.agileInstance()).toBe(dummyAgile);
    expect(observer.key).toBe('testKey');
    expect(Array.from(observer.dependents)).toStrictEqual([
      dummyObserver1,
      dummyObserver2,
    ]);
    expect(Array.from(observer.subscribedTo)).toStrictEqual([
      dummySubscription1,
      dummySubscription2,
    ]);
    expect(observer.value).toBe('coolValue');
    expect(observer.previousValue).toBe('coolValue');

    expect(dummySubscription1.addSubscription).toHaveBeenCalledWith(observer);
    expect(dummySubscription2.addSubscription).toHaveBeenCalledWith(observer);
  });

  describe('Observer Function Tests', () => {
    let observer: Observer;

    beforeEach(() => {
      observer = new Observer(dummyAgile, { key: 'observer' });
    });

    describe('ingest function tests', () => {
      it('should create RuntimeJob containing the Observer and ingest it into the Runtime (default config)', () => {
        jest.spyOn(Utils, 'generateId').mockReturnValueOnce('generatedKey');
        dummyAgile.runtime.ingest = jest.fn((job: RuntimeJob) => {
          expect(job.key).toBe(`${observer.key}_generatedKey`);
          expect(job.observer).toBe(observer);
          expect(job.config).toStrictEqual({
            background: false,
            sideEffects: {
              enabled: true,
              exclude: [],
            },
            force: false,
            maxTriesToUpdate: 3,
            any: {},
          });
        });

        observer.ingest();

        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
          expect.any(RuntimeJob),
          {
            perform: true,
          }
        );
      });

      it('should create RuntimeJob containing the Observer and ingest it into the Runtime (specific config)', () => {
        dummyAgile.runtime.ingest = jest.fn((job: RuntimeJob) => {
          expect(job.key).toBe('coolKey');
          expect(job.observer).toBe(observer);
          expect(job.config).toStrictEqual({
            background: true,
            sideEffects: {
              enabled: true,
              exclude: [],
            },
            force: true,
            maxTriesToUpdate: 3,
            any: {},
          });
        });

        observer.ingest({
          background: true,
          key: 'coolKey',
          perform: false,
          force: true,
        });

        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
          expect.any(RuntimeJob),
          {
            perform: false,
          }
        );
      });
    });

    describe('perform function tests', () => {
      it('should print warning', () => {
        const dummyJob = new RuntimeJob(observer);

        observer.perform(dummyJob);

        LogMock.hasLoggedCode('17:03:00');
      });
    });

    describe('addDependent function tests', () => {
      let dummyObserver1: Observer;
      let dummyObserver2: Observer;

      beforeEach(() => {
        dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
        dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });

        observer.dependents = new Set([dummyObserver2]);
      });

      it('should add specified Observer to the dependents array', () => {
        observer.addDependent(dummyObserver1);

        expect(Array.from(observer.dependents)).toStrictEqual([
          dummyObserver2,
          dummyObserver1,
        ]);
      });

      it("shouldn't add specified Observer twice to the dependents array", () => {
        observer.addDependent(dummyObserver1);

        observer.addDependent(dummyObserver1);

        expect(Array.from(observer.dependents)).toStrictEqual([
          dummyObserver2,
          dummyObserver1,
        ]);
      });
    });

    describe('removeDependent function tests', () => {
      let dummyObserver1: Observer;
      let dummyObserver2: Observer;

      beforeEach(() => {
        dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
        dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });

        observer.dependents = new Set([dummyObserver1, dummyObserver2]);
      });

      it('should remove specified Observer from the dependents array', () => {
        observer.removeDependent(dummyObserver1);

        expect(Array.from(observer.dependents)).toStrictEqual([dummyObserver2]);
      });
    });
  });
});
