import { Agile, Observer, SubscriptionContainer } from '../../../../../src';

describe('SubscriptionContainer Tests', () => {
  let dummyAgile: Agile;
  let dummyObserver1: Observer;
  let dummyObserver2: Observer;

  beforeEach(() => {
    dummyAgile = new Agile();
    dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
    dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
  });

  it('should create SubscriptionContainer', () => {
    const subscriptionContainer = new SubscriptionContainer(
      [dummyObserver1, dummyObserver2],
      'dummyKey'
    );

    expect(subscriptionContainer.key).toBe('dummyKey');
    expect(subscriptionContainer.ready).toBeFalsy();
    expect(subscriptionContainer.subs.size).toBe(2);
    expect(subscriptionContainer.subs.has(dummyObserver1)).toBeTruthy();
    expect(subscriptionContainer.subs.has(dummyObserver2)).toBeTruthy();
    expect(subscriptionContainer.isObjectBased).toBeFalsy();
    expect(subscriptionContainer.observerKeysToUpdate).toStrictEqual([]);
    expect(subscriptionContainer.subsObject).toBeUndefined();
  });
});
