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
  });

  it('should create SubscriptionContainer with passed subs array (default config)', () => {
    jest.spyOn(Utils, 'generateId').mockReturnValueOnce('generatedId');
    jest
      .spyOn(SubscriptionContainer.prototype, 'addSubscription')
      .mockReturnValueOnce()
      .mockReturnValueOnce();

    const subscriptionContainer = new SubscriptionContainer([
      dummyObserver1,
      dummyObserver2,
    ]);

    expect(subscriptionContainer.addSubscription).toHaveBeenCalledTimes(2);
    expect(subscriptionContainer.addSubscription).toHaveBeenCalledWith(
      dummyObserver1,
      {
        proxyPaths: undefined,
        selectorMethods: undefined,
        key: undefined,
      }
    );
    expect(subscriptionContainer.addSubscription).toHaveBeenCalledWith(
      dummyObserver2,
      {
        proxyPaths: undefined,
        selectorMethods: undefined,
        key: undefined,
      }
    );

    expect(subscriptionContainer.key).toBe('generatedId');
    expect(subscriptionContainer.ready).toBeFalsy();
    expect(subscriptionContainer.componentId).toBeUndefined();
    expect(Array.from(subscriptionContainer.subscribers)).toStrictEqual([]); // because of mocking addSubscription
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
  });

  it('should create SubscriptionContainer with passed subs object (default config)', () => {
    jest.spyOn(Utils, 'generateId').mockReturnValueOnce('generatedId');
    jest
      .spyOn(SubscriptionContainer.prototype, 'addSubscription')
      .mockReturnValueOnce()
      .mockReturnValueOnce();

    const subscriptionContainer = new SubscriptionContainer({
      dummyObserver1: dummyObserver1,
      dummyObserver2: dummyObserver2,
    });

    expect(subscriptionContainer.addSubscription).toHaveBeenCalledTimes(2);
    expect(subscriptionContainer.addSubscription).toHaveBeenCalledWith(
      dummyObserver1,
      {
        proxyPaths: undefined,
        selectorMethods: undefined,
        key: 'dummyObserver1',
      }
    );
    expect(subscriptionContainer.addSubscription).toHaveBeenCalledWith(
      dummyObserver2,
      {
        proxyPaths: undefined,
        selectorMethods: undefined,
        key: 'dummyObserver2',
      }
    );

    expect(subscriptionContainer.key).toBe('generatedId');
    expect(subscriptionContainer.ready).toBeFalsy();
    expect(subscriptionContainer.componentId).toBeUndefined();
    expect(Array.from(subscriptionContainer.subscribers)).toStrictEqual([]); // because of mocking addSubscription
    expect(Array.from(subscriptionContainer.updatedSubscribers)).toStrictEqual(
      []
    );
    expect(subscriptionContainer.isObjectBased).toBeTruthy();
    expect(subscriptionContainer.subscriberKeysWeakMap).toStrictEqual(
      expect.any(WeakMap)
    );
    expect(subscriptionContainer.selectorsWeakMap).toStrictEqual(
      expect.any(WeakMap)
    );
  });

  it('should create SubscriptionContainer with passed subs array (specific config)', () => {
    jest
      .spyOn(SubscriptionContainer.prototype, 'addSubscription')
      .mockReturnValueOnce()
      .mockReturnValueOnce();

    dummyProxyWeakMap.set(dummyObserver1, {
      paths: 'dummyObserver1_paths' as any,
    });
    dummyProxyWeakMap.set(dummyObserver2, {
      paths: 'dummyObserver2_paths' as any,
    });
    dummySelectorWeakMap.set(dummyObserver2, {
      methods: 'dummyObserver2_selectors' as any,
    });

    const subscriptionContainer = new SubscriptionContainer(
      [dummyObserver1, dummyObserver2],
      {
        key: 'dummyKey',
        proxyWeakMap: dummyProxyWeakMap,
        selectorWeakMap: dummySelectorWeakMap,
        componentId: 'testID',
      }
    );

    expect(subscriptionContainer.addSubscription).toHaveBeenCalledTimes(2);
    expect(subscriptionContainer.addSubscription).toHaveBeenCalledWith(
      dummyObserver1,
      {
        proxyPaths: 'dummyObserver1_paths',
        selectorMethods: undefined,
        key: undefined,
      }
    );
    expect(subscriptionContainer.addSubscription).toHaveBeenCalledWith(
      dummyObserver2,
      {
        proxyPaths: 'dummyObserver2_paths',
        selectorMethods: 'dummyObserver2_selectors',
        key: undefined,
      }
    );

    expect(subscriptionContainer.key).toBe('dummyKey');
    expect(subscriptionContainer.ready).toBeFalsy();
    expect(subscriptionContainer.componentId).toBe('testID');
    expect(Array.from(subscriptionContainer.subscribers)).toStrictEqual([]); // because of mocking addSubscription
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

  describe('Subscription Container Function Tests', () => {
    let subscriptionContainer: SubscriptionContainer;

    beforeEach(() => {
      subscriptionContainer = new SubscriptionContainer([]);
    });

    describe('addSubscription function tests', () => {
      it(
        'should create selector methods based on the specified proxy paths, ' +
          "assign newly created and provided selector methods to the 'selectorsWeakMap' " +
          'and subscribe the specified Observer to the Subscription Container',
        () => {
          dummyObserver1.value = {
            das: { haus: { vom: 'nikolaus' } },
            alle: { meine: 'entchien' },
            test1: 'test1Value',
            test2: 'test2Value',
            test3: 'test3Value',
          };
          subscriptionContainer.selectorsWeakMap.set(dummyObserver1, {
            methods: [(value) => value.test3],
          });
          subscriptionContainer.selectorsWeakMap.set(dummyObserver2, {
            methods: [(value) => 'doesNotMatter'],
          });
          subscriptionContainer.subscriberKeysWeakMap.set(
            dummyObserver2,
            'dummyObserver2'
          );

          subscriptionContainer.addSubscription(dummyObserver1, {
            key: 'dummyObserver1',
            proxyPaths: [['das', 'haus', 'vom'], ['test1']],
            selectorMethods: [
              (value) => value.alle.meine,
              (value) => value.test2,
            ],
          });

          expect(Array.from(subscriptionContainer.subscribers)).toStrictEqual([
            dummyObserver1,
          ]);
          expect(Array.from(dummyObserver1.subscribedTo)).toStrictEqual([
            subscriptionContainer,
          ]);

          // should assign specified selectors/(and selectors created from proxy paths) to the 'selectorsWeakMap'
          const observer1Selector = subscriptionContainer.selectorsWeakMap.get(
            dummyObserver1
          ) as any;
          expect(observer1Selector.methods.length).toBe(5);
          expect(observer1Selector.methods[0](dummyObserver1.value)).toBe(
            'test3Value'
          );
          expect(observer1Selector.methods[1](dummyObserver1.value)).toBe(
            'entchien'
          );
          expect(observer1Selector.methods[2](dummyObserver1.value)).toBe(
            'test2Value'
          );
          expect(observer1Selector.methods[3](dummyObserver1.value)).toBe(
            'nikolaus'
          );
          expect(observer1Selector.methods[4](dummyObserver1.value)).toBe(
            'test1Value'
          );

          // shouldn't overwrite already set values in 'selectorsWeakMap' (Observer2)
          const observer2Selector = subscriptionContainer.selectorsWeakMap.get(
            dummyObserver2
          ) as any;
          expect(observer2Selector.methods.length).toBe(1);
          expect(observer2Selector.methods[0](null)).toBe('doesNotMatter');

          // should assign specified key to the 'subscriberKeysWeakMap'
          const observer1Key = subscriptionContainer.subscriberKeysWeakMap.get(
            dummyObserver1
          );
          expect(observer1Key).toBe('dummyObserver1');

          // shouldn't overwrite already set values in 'subscriberKeysWeakMap' (Observer2)
          const observer2Key = subscriptionContainer.subscriberKeysWeakMap.get(
            dummyObserver2
          );
          expect(observer2Key).toBe('dummyObserver2');
        }
      );
    });

    describe('removeSubscription function tests', () => {
      let subscriptionContainer: SubscriptionContainer;

      beforeEach(() => {
        subscriptionContainer = new SubscriptionContainer([]);

        subscriptionContainer.subscribers = new Set([
          dummyObserver1,
          dummyObserver2,
        ]);
        dummyObserver1.subscribedTo = new Set([subscriptionContainer]);
        dummyObserver2.subscribedTo = new Set([subscriptionContainer]);

        subscriptionContainer.selectorsWeakMap.set(dummyObserver1, {
          methods: [],
        });
        subscriptionContainer.selectorsWeakMap.set(dummyObserver2, {
          methods: [],
        });
        subscriptionContainer.subscriberKeysWeakMap.set(
          dummyObserver1,
          'dummyObserver1'
        );
        subscriptionContainer.subscriberKeysWeakMap.set(
          dummyObserver2,
          'dummyObserver2'
        );
      });

      it('should remove subscribed Observer from Subscription Container', () => {
        subscriptionContainer.removeSubscription(dummyObserver1);

        expect(Array.from(subscriptionContainer.subscribers)).toStrictEqual([
          dummyObserver2,
        ]);

        expect(
          subscriptionContainer.selectorsWeakMap.get(dummyObserver1)
        ).toBeUndefined();
        expect(
          subscriptionContainer.selectorsWeakMap.get(dummyObserver2)
        ).not.toBeUndefined();

        expect(
          subscriptionContainer.subscriberKeysWeakMap.get(dummyObserver1)
        ).toBeUndefined();
        expect(
          subscriptionContainer.subscriberKeysWeakMap.get(dummyObserver2)
        ).toBe('dummyObserver2');

        expect(Array.from(dummyObserver1.subscribedTo)).toStrictEqual([]);
        expect(Array.from(dummyObserver2.subscribedTo)).toStrictEqual([
          subscriptionContainer,
        ]);
      });
    });
  });
});
