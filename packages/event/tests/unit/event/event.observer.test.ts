import { EventObserver, Event } from '../../../src';
import { Agile, Observer, SubscriptionContainer } from '@agile-ts/core';
import { LogMock } from '../../../../core/tests/helper/logMock';

describe('EventObserver Tests', () => {
  let dummyAgile: Agile;
  let dummyEvent: Event;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile();
    dummyEvent = new Event(dummyAgile);

    jest.clearAllMocks();
  });

  it('should create EventObserver (default config)', () => {
    const eventObserver = new EventObserver(dummyEvent);

    expect(eventObserver).toBeInstanceOf(EventObserver);
    expect(eventObserver.event()).toBe(dummyEvent);
    expect(eventObserver.key).toBeUndefined();
    expect(eventObserver.dependents.size).toBe(0);
    expect(eventObserver.subscribedTo.size).toBe(0);
  });

  it('should create EventObserver (specific config)', () => {
    const dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
    const dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
    const dummySubscription1 = new SubscriptionContainer([]);
    const dummySubscription2 = new SubscriptionContainer([]);

    const eventObserver = new EventObserver(dummyEvent, {
      key: 'testKey',
      dependents: [dummyObserver1, dummyObserver2],
      subs: [dummySubscription1, dummySubscription2],
    });

    expect(eventObserver).toBeInstanceOf(EventObserver);
    expect(eventObserver.event()).toBe(dummyEvent);
    expect(eventObserver.key).toBe('testKey');
    expect(eventObserver.dependents.size).toBe(2);
    expect(eventObserver.dependents.has(dummyObserver2)).toBeTruthy();
    expect(eventObserver.dependents.has(dummyObserver1)).toBeTruthy();
    expect(eventObserver.subscribedTo.size).toBe(2);
    expect(eventObserver.subscribedTo.has(dummySubscription1)).toBeTruthy();
    expect(eventObserver.subscribedTo.has(dummySubscription2)).toBeTruthy();
  });

  describe('EventObserver Function Tests', () => {
    let eventObserver: EventObserver;

    beforeEach(() => {
      eventObserver = new EventObserver(dummyEvent, {
        key: 'eventObserverKey',
      });
    });

    describe('perform function tests', () => {
      // No tests necessary
    });
  });
});
