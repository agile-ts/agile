import {
  Agile,
  ComponentSubscriptionContainer,
  Observer,
} from '../../../../../src';
import { LogMock } from '../../../../helper/logMock';

describe('ComponentSubscriptionContainer Tests', () => {
  let dummyAgile: Agile;
  let dummyObserver1: Observer;
  let dummyObserver2: Observer;

  beforeEach(() => {
    jest.clearAllMocks();
    LogMock.mockLogs();

    dummyAgile = new Agile();
    dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
    dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
  });

  it('should create ComponentSubscriptionContainer', () => {
    const dummyIntegration = { dummy: 'integration' };

    const subscriptionContainer = new ComponentSubscriptionContainer(
      dummyIntegration,
      [dummyObserver1, dummyObserver2],
      { key: 'dummyKey', proxyKeyMap: { myState: { paths: [['hi']] } } }
    );

    expect(subscriptionContainer.component).toStrictEqual(dummyIntegration);

    expect(subscriptionContainer.key).toBe('dummyKey');
    expect(subscriptionContainer.ready).toBeFalsy();
    expect(subscriptionContainer.subscribers.size).toBe(2);
    expect(subscriptionContainer.subscribers.has(dummyObserver1)).toBeTruthy();
    expect(subscriptionContainer.subscribers.has(dummyObserver2)).toBeTruthy();
    expect(subscriptionContainer.isObjectBased).toBeFalsy();
    expect(subscriptionContainer.observerKeysToUpdate).toStrictEqual([]);
    expect(subscriptionContainer.subsObject).toBeUndefined();
    expect(subscriptionContainer.proxyKeyMap).toStrictEqual({
      myState: { paths: [['hi']] },
    });
    expect(subscriptionContainer.proxyBased).toBeTruthy();
  });
});
