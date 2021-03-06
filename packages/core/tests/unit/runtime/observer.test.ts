import {
  Observer,
  Agile,
  SubscriptionContainer,
  RuntimeJob,
} from '../../../src';

describe('Observer Tests', () => {
  let dummyAgile: Agile;
  let dummyObserver1: Observer;
  let dummyObserver2: Observer;
  let dummySubscription1: SubscriptionContainer;
  let dummySubscription2: SubscriptionContainer;

  beforeEach(() => {
    dummyAgile = new Agile();
    dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
    dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
    dummySubscription1 = new SubscriptionContainer();
    dummySubscription2 = new SubscriptionContainer();

    console.warn = jest.fn();
    jest.spyOn(Observer.prototype, 'subscribe');
  });

  it('should create Observer (default config)', () => {
    const observer = new Observer(dummyAgile);

    expect(observer._key).toBeUndefined();
    expect(observer.value).toBeUndefined();
    expect(observer.dependents.size).toBe(0);
    expect(observer.subs.size).toBe(0);
  });

  it('should create Observer (specific config)', () => {
    const observer = new Observer(dummyAgile, {
      key: 'testKey',
      subs: [dummySubscription1, dummySubscription2],
      dependents: [dummyObserver1, dummyObserver2],
      value: 'coolValue',
    });

    expect(observer._key).toBe('testKey');
    expect(observer.value).toBe('coolValue');
    expect(observer.dependents.size).toBe(2);
    expect(observer.dependents.has(dummyObserver2)).toBeTruthy();
    expect(observer.dependents.has(dummyObserver1)).toBeTruthy();
    expect(observer.subs.size).toBe(2);
    expect(observer.subs.has(dummySubscription1)).toBeTruthy();
    expect(observer.subs.has(dummySubscription2)).toBeTruthy();

    expect(observer.subscribe).toHaveBeenCalledWith(dummySubscription1);
    expect(observer.subscribe).toHaveBeenCalledWith(dummySubscription2);
  });

  describe('Observer Function Tests', () => {
    let observer: Observer;

    beforeEach(() => {
      observer = new Observer(dummyAgile, { key: 'observer' });
    });

    describe('key set function tests', () => {
      it('should update key in Observer', () => {
        observer.key = 'myNewDummyKey';

        expect(observer._key).toBe('myNewDummyKey');
      });
    });

    describe('key get function tests', () => {
      it('should return current key of Observer', () => {
        observer._key = 'myDummyKey';

        expect(observer.key).toBe('myDummyKey');
      });
    });

    describe('ingest function tests', () => {
      it('should create RuntimeJob and ingest Observer into the Runtime (default config)', () => {
        dummyAgile.runtime.ingest = jest.fn((job: RuntimeJob) => {
          expect(job._key).toBe(observer._key);
          expect(job.observer).toBe(observer);
          expect(job.config).toStrictEqual({
            background: false,
            sideEffects: {
              enabled: true,
              exclude: [],
            },
            force: false,
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

      it('should create RuntimeJob and ingest Observer into the Runtime (specific config)', () => {
        dummyAgile.runtime.ingest = jest.fn((job: RuntimeJob) => {
          expect(job._key).toBe('coolKey');
          expect(job.observer).toBe(observer);
          expect(job.config).toStrictEqual({
            background: true,
            sideEffects: {
              enabled: true,
              exclude: [],
            },
            force: true,
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

        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: Perform function isn't Set in Observer! Be aware that Observer is no stand alone class!"
        );
      });
    });

    describe('depend function tests', () => {
      let dummyObserver1: Observer;
      let dummyObserver2: Observer;

      beforeEach(() => {
        dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
        dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
      });

      it('should add passed Observer to deps', () => {
        observer.depend(dummyObserver1);

        expect(observer.dependents.size).toBe(1);
        expect(observer.dependents.has(dummyObserver2));
      });

      it("shouldn't add the same Observer twice to deps", () => {
        observer.depend(dummyObserver1);

        observer.depend(dummyObserver1);

        expect(observer.dependents.size).toBe(1);
        expect(observer.dependents.has(dummyObserver1));
      });
    });

    describe('subscribe function tests', () => {
      let dummySubscriptionContainer1: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer1 = new SubscriptionContainer();
      });

      it('should add subscriptionContainer to subs and this(Observer) to SubscriptionContainer subs', () => {
        observer.subscribe(dummySubscriptionContainer1);

        expect(observer.subs.size).toBe(1);
        expect(observer.subs.has(dummySubscriptionContainer1));
        expect(dummySubscriptionContainer1.subs.size).toBe(1);
        expect(dummySubscriptionContainer1.subs.has(observer)).toBeTruthy();
      });

      it("shouldn't add same subscriptionContainer twice to subs", () => {
        observer.subscribe(dummySubscriptionContainer1);

        observer.subscribe(dummySubscriptionContainer1);

        expect(observer.subs.size).toBe(1);
        expect(observer.subs.has(dummySubscriptionContainer1));
        expect(dummySubscriptionContainer1.subs.size).toBe(1);
        expect(dummySubscriptionContainer1.subs.has(observer)).toBeTruthy();
      });
    });

    describe('unsubscribe function tests', () => {
      let dummySubscriptionContainer1: SubscriptionContainer;
      let dummySubscriptionContainer2: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer1 = new SubscriptionContainer();
        dummySubscriptionContainer2 = new SubscriptionContainer();
        observer.subscribe(dummySubscriptionContainer1);
        observer.subscribe(dummySubscriptionContainer2);
      });

      it('should remove subscriptionContainer from subs and this(Observer) from SubscriptionContainer subs', () => {
        observer.unsubscribe(dummySubscriptionContainer1);

        expect(observer.subs.size).toBe(1);
        expect(observer.subs.has(dummySubscriptionContainer1));
        expect(dummySubscriptionContainer1.subs.size).toBe(0);
        expect(dummySubscriptionContainer2.subs.size).toBe(1);
        expect(dummySubscriptionContainer2.subs.has(observer)).toBeTruthy();
      });
    });
  });
});
