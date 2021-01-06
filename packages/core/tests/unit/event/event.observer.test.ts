import {
  EventObserver,
  Agile,
  Observer,
  SubscriptionContainer,
  Event,
  RuntimeJob,
} from '../../../src';

describe('EventObserver Tests', () => {
  let dummyAgile: Agile;
  let dummyEvent: Event;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });
    dummyEvent = new Event(dummyAgile);
  });

  it('should create EventObserver (default config)', () => {
    const eventObserver = new EventObserver(dummyEvent);

    expect(eventObserver).toBeInstanceOf(EventObserver);
    expect(eventObserver.event()).toBe(dummyEvent);
    expect(eventObserver.value).toBeUndefined();
    expect(eventObserver._key).toBeUndefined();
    expect(eventObserver.deps.size).toBe(0);
    expect(eventObserver.subs.size).toBe(0);
  });

  it('should create EventObserver (specific config)', () => {
    const dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
    const dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
    const dummySubscription1 = new SubscriptionContainer();
    const dummySubscription2 = new SubscriptionContainer();

    const eventObserver = new EventObserver(dummyEvent, {
      key: 'testKey',
      deps: [dummyObserver1, dummyObserver2],
      subs: [dummySubscription1, dummySubscription2],
    });

    expect(eventObserver).toBeInstanceOf(EventObserver);
    expect(eventObserver.event()).toBe(dummyEvent);
    expect(eventObserver.value).toBeUndefined();
    expect(eventObserver._key).toBe('testKey');
    expect(eventObserver.deps.size).toBe(2);
    expect(eventObserver.deps.has(dummyObserver2)).toBeTruthy();
    expect(eventObserver.deps.has(dummyObserver1)).toBeTruthy();
    expect(eventObserver.subs.size).toBe(2);
    expect(eventObserver.subs.has(dummySubscription1)).toBeTruthy();
    expect(eventObserver.subs.has(dummySubscription2)).toBeTruthy();
  });

  describe('EventObserver Function Tests', () => {
    let eventObserver: EventObserver;

    beforeEach(() => {
      eventObserver = new EventObserver(dummyEvent, {
        key: 'eventObserverKey',
      });
    });

    describe('trigger function tests', () => {
      it('should create RuntimeJob and ingest it into the Runtime (default config)', () => {
        dummyAgile.runtime.ingest = jest.fn((job: RuntimeJob) => {
          expect(job._key).toBe(eventObserver._key);
          expect(job.observer).toBe(eventObserver);
          expect(job.config).toStrictEqual({
            background: false,
            sideEffects: true,
            force: false,
          });
        });

        eventObserver.trigger();

        expect(dummyAgile.runtime.ingest).toHaveBeenCalledWith(
          expect.any(RuntimeJob),
          {
            perform: true,
          }
        );
      });

      it('should ingest Event into Runtime (specific config)', () => {
        dummyAgile.runtime.ingest = jest.fn((job: RuntimeJob) => {
          expect(job._key).toBe('coolKey');
          expect(job.observer).toBe(eventObserver);
          expect(job.config).toStrictEqual({
            background: true,
            sideEffects: true,
            force: true,
          });
        });

        eventObserver.trigger({
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
      // No tests necessary
    });
  });
});
