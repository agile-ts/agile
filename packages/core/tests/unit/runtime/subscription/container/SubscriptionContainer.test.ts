import {
  Agile,
  Observer,
  ProxyWeakMapType,
  SelectorWeakMapType,
  SubscriptionContainer,
} from '../../../../../src';
import * as Utils from '@agile-ts/utils';
import { LogMock } from '../../../../helper/logMock';

describe('SubscriptionContainer Tests', () => {
  let dummyAgile: Agile;
  let dummyObserver1: Observer;
  let dummyObserver2: Observer;
  let dummySelectorWeakMap: SelectorWeakMapType;
  let dummyProxyWeakMap: ProxyWeakMapType;

  beforeEach(() => {
    jest.clearAllMocks();
    LogMock.mockLogs();

    dummyAgile = new Agile();
    dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
    dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
    dummySelectorWeakMap = new WeakMap();
    dummyProxyWeakMap = new WeakMap();

    jest.spyOn(SubscriptionContainer.prototype, 'assignProxySelectors');
  });

  it('should create SubscriptionContainer (default config)', () => {
    jest.spyOn(Utils, 'generateId').mockReturnValue('generatedId');

    const subscriptionContainer = new SubscriptionContainer();

    expect(subscriptionContainer.assignProxySelectors).toHaveBeenCalledWith(
      expect.any(WeakMap),
      expect.any(WeakMap),
      []
    );

    expect(subscriptionContainer.key).toBe('generatedId');
    expect(subscriptionContainer.ready).toBeFalsy();
    expect(subscriptionContainer.componentId).toBeUndefined();
    expect(subscriptionContainer.subscribers.size).toBe(0);
    expect(subscriptionContainer.updatedSubscribers).toStrictEqual([]);
    expect(subscriptionContainer.isObjectBased).toBeFalsy();
    expect(subscriptionContainer.subscriberKeysWeakMap).toStrictEqual(
      expect.any(WeakMap)
    );
    expect(subscriptionContainer.selectorsWeakMap).not.toBe(
      dummySelectorWeakMap
    );
    expect(subscriptionContainer.selectorsWeakMap).toStrictEqual(
      expect.any(WeakMap)
    );
  });

  it('should create SubscriptionContainer (specific config)', () => {
    const subscriptionContainer = new SubscriptionContainer(
      [dummyObserver1, dummyObserver2],
      {
        key: 'dummyKey',
        proxyWeakMap: dummyProxyWeakMap,
        selectorWeakMap: dummySelectorWeakMap,
        componentId: 'testID',
      }
    );

    expect(
      subscriptionContainer.assignProxySelectors
    ).toHaveBeenCalledWith(dummySelectorWeakMap, dummyProxyWeakMap, [
      dummyObserver1,
      dummyObserver2,
    ]);

    expect(subscriptionContainer.key).toBe('dummyKey');
    expect(subscriptionContainer.ready).toBeFalsy();
    expect(subscriptionContainer.componentId).toBe('testID');
    expect(subscriptionContainer.subscribers.size).toBe(2);
    expect(subscriptionContainer.subscribers.has(dummyObserver1)).toBeTruthy();
    expect(subscriptionContainer.subscribers.has(dummyObserver2)).toBeTruthy();
    expect(subscriptionContainer.updatedSubscribers).toStrictEqual([]);
    expect(subscriptionContainer.isObjectBased).toBeFalsy();
    expect(subscriptionContainer.subscriberKeysWeakMap).toStrictEqual(
      expect.any(WeakMap)
    );
    expect(subscriptionContainer.selectorsWeakMap).toBe(dummySelectorWeakMap);
  });

  describe('Subscription Container Function Tests', () => {
    let observer: SubscriptionContainer;

    beforeEach(() => {
      observer = new SubscriptionContainer();
    });

    describe('assignProxySelectors function tests', () => {
      beforeEach(() => {});

      it('todo', () => {
        // TODO
      });
    });
  });
});
