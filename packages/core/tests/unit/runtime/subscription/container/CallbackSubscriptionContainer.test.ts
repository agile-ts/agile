import {
  Agile,
  CallbackSubscriptionContainer,
  Observer,
} from '../../../../../src';

describe('CallbackSubscriptionContainer Tests', () => {
  let dummyAgile: Agile;
  let dummyObserver1: Observer;
  let dummyObserver2: Observer;

  beforeEach(() => {
    dummyAgile = new Agile();
    dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
    dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
  });

  it('should create CallbackSubscriptionContainer', () => {
    const dummyIntegration = () => {
      /* empty function */
    };

    const subscriptionContainer = new CallbackSubscriptionContainer(
      dummyIntegration,
      [dummyObserver1, dummyObserver2],
      'dummyKey'
    );

    expect(subscriptionContainer.callback).toBe(dummyIntegration);

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
