import { Agile, Observer, SubscriptionContainer } from '../../../../../src';
import * as Utils from '../../../../../src/utils';

describe('SubscriptionContainer Tests', () => {
  let dummyAgile: Agile;
  let dummyObserver1: Observer;
  let dummyObserver2: Observer;

  beforeEach(() => {
    dummyAgile = new Agile();
    dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
    dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
  });

  it('should create SubscriptionContainer (default config)', () => {
    jest.spyOn(Utils, 'generateId').mockReturnValue('generatedId');

    const subscriptionContainer = new SubscriptionContainer();

    expect(subscriptionContainer.key).toBe('generatedId');
    expect(subscriptionContainer.ready).toBeFalsy();
    expect(subscriptionContainer.subs.size).toBe(0);
    expect(subscriptionContainer.isObjectBased).toBeFalsy();
    expect(subscriptionContainer.observerKeysToUpdate).toStrictEqual([]);
    expect(subscriptionContainer.subsObject).toBeUndefined();
  });

  it('should create SubscriptionContainer (specific config)', () => {
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
