import {
  Agile,
  CallbackSubscriptionContainer,
  Observer,
  ProxyWeakMapType,
  SelectorWeakMapType,
} from '../../../../../src';
import { LogMock } from '../../../../helper/logMock';

describe('CallbackSubscriptionContainer Tests', () => {
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
  });

  it('should create CallbackSubscriptionContainer', () => {
    const dummyIntegration = () => {
      /* empty function */
    };

    const subscriptionContainer = new CallbackSubscriptionContainer(
      dummyIntegration,
      [dummyObserver1, dummyObserver2],
      {
        key: 'dummyKey',
        proxyWeakMap: dummyProxyWeakMap,
        selectorWeakMap: dummySelectorWeakMap,
        componentId: 'testID',
      }
    );

    expect(subscriptionContainer.callback).toBe(dummyIntegration);

    // Check if SubscriptionContainer was called with correct parameters
    expect(subscriptionContainer.key).toBe('dummyKey');
    expect(subscriptionContainer.ready).toBeFalsy();
    expect(subscriptionContainer.componentId).toBe('testID');
    expect(Array.from(subscriptionContainer.subscribers)).toStrictEqual([
      dummyObserver1,
      dummyObserver2,
    ]);
    expect(Array.from(subscriptionContainer.updatedSubscribers)).toStrictEqual(
      []
    );
    expect(subscriptionContainer.isObjectBased).toBeFalsy();
    expect(subscriptionContainer.subscriberKeysWeakMap).toStrictEqual(
      expect.any(WeakMap)
    );
    expect(subscriptionContainer.selectorsWeakMap).toStrictEqual(
      expect.any(WeakMap)
    );
    expect(subscriptionContainer.selectorsWeakMap).not.toBe(
      dummySelectorWeakMap
    );
  });
});
