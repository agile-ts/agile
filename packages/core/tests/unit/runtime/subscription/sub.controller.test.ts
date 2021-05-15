import {
  Agile,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
  Observer,
  SubController,
  SubscriptionContainer,
} from '../../../../src';
import * as Utils from '@agile-ts/utils';
import mockConsole from 'jest-mock-console';

describe('SubController Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole(['error', 'warn']);

    dummyAgile = new Agile({ localStorage: false });
  });

  it('should create SubController', () => {
    const subController = new SubController(dummyAgile);

    expect(subController.callbackSubs.size).toBe(0);
    expect(subController.callbackSubs.size).toBe(0);
  });

  describe('SubController Function Tests', () => {
    let subController: SubController;
    let dummyObserver1: Observer;
    let dummyObserver2: Observer;

    beforeEach(() => {
      dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
      dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
      subController = new SubController(dummyAgile);
    });

    describe('subscribeWithSubsObject function tests', () => {
      const dummyIntegration = 'myDummyIntegration';
      let dummySubscriptionContainer: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer = new SubscriptionContainer();
        dummyObserver1.value = 'myCoolValue';

        subController.registerSubscription = jest.fn(
          () => dummySubscriptionContainer
        );
        jest.spyOn(dummyObserver1, 'subscribe');
        jest.spyOn(dummyObserver2, 'subscribe');
      });

      it('should create subscriptionContainer and add in Object shape passed Observers to it', () => {
        const subscribeWithSubsResponse = subController.subscribeWithSubsObject(
          dummyIntegration,
          {
            dummyObserver1: dummyObserver1,
            dummyObserver2: dummyObserver2,
          },
          {
            key: 'subscribeWithSubsObjectKey',
            proxyKeyMap: {},
            waitForMount: false,
          }
        );

        expect(subscribeWithSubsResponse).toStrictEqual({
          props: {
            dummyObserver1: 'myCoolValue',
          },
          subscriptionContainer: dummySubscriptionContainer,
        });

        expect(subController.registerSubscription).toHaveBeenCalledWith(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          {
            key: 'subscribeWithSubsObjectKey',
            proxyKeyMap: {},
            waitForMount: false,
          }
        );

        expect(dummySubscriptionContainer.isObjectBased).toBeTruthy();
        expect(dummySubscriptionContainer.subsObject).toStrictEqual({
          dummyObserver1: dummyObserver1,
          dummyObserver2: dummyObserver2,
        });

        expect(dummySubscriptionContainer.subscribers.size).toBe(2);
        expect(
          dummySubscriptionContainer.subscribers.has(dummyObserver1)
        ).toBeTruthy();
        expect(
          dummySubscriptionContainer.subscribers.has(dummyObserver2)
        ).toBeTruthy();

        expect(dummyObserver1.subscribe).toHaveBeenCalledWith(
          dummySubscriptionContainer
        );
        expect(dummyObserver2.subscribe).toHaveBeenCalledWith(
          dummySubscriptionContainer
        );
      });
    });

    describe('subscribeWithSubsArray function tests', () => {
      const dummyIntegration = 'myDummyIntegration';
      let dummySubscriptionContainer: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer = new SubscriptionContainer();

        subController.registerSubscription = jest.fn(
          () => dummySubscriptionContainer
        );
        jest.spyOn(dummyObserver1, 'subscribe');
        jest.spyOn(dummyObserver2, 'subscribe');
      });

      it('should create subscriptionContainer and add in Array Shape passed Observers to it', () => {
        const subscribeWithSubsArrayResponse = subController.subscribeWithSubsArray(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          {
            key: 'subscribeWithSubsArrayKey',
            proxyKeyMap: {},
            waitForMount: false,
          }
        );

        expect(subscribeWithSubsArrayResponse).toBe(dummySubscriptionContainer);

        expect(subController.registerSubscription).toHaveBeenCalledWith(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          {
            key: 'subscribeWithSubsArrayKey',
            proxyKeyMap: {},
            waitForMount: false,
          }
        );

        expect(dummySubscriptionContainer.isObjectBased).toBeFalsy();
        expect(dummySubscriptionContainer.subsObject).toBeUndefined();

        expect(dummySubscriptionContainer.subscribers.size).toBe(2);
        expect(
          dummySubscriptionContainer.subscribers.has(dummyObserver1)
        ).toBeTruthy();
        expect(
          dummySubscriptionContainer.subscribers.has(dummyObserver2)
        ).toBeTruthy();

        expect(dummyObserver1.subscribe).toHaveBeenCalledWith(
          dummySubscriptionContainer
        );
        expect(dummyObserver2.subscribe).toHaveBeenCalledWith(
          dummySubscriptionContainer
        );
      });
    });

    describe('unsubscribe function tests', () => {
      beforeEach(() => {
        jest.spyOn(dummyObserver1, 'unsubscribe');
        jest.spyOn(dummyObserver2, 'unsubscribe');
      });

      it('should unsubscribe callbackSubscriptionContainer', () => {
        const dummyIntegration = () => {
          /* empty function */
        };
        const callbackSubscriptionContainer = subController.registerCallbackSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2]
        );

        subController.unsubscribe(callbackSubscriptionContainer);

        expect(subController.callbackSubs.size).toBe(0);
        expect(callbackSubscriptionContainer.ready).toBeFalsy();
        expect(dummyObserver1.unsubscribe).toHaveBeenCalledWith(
          callbackSubscriptionContainer
        );
        expect(dummyObserver2.unsubscribe).toHaveBeenCalledWith(
          callbackSubscriptionContainer
        );
      });

      it('should unsubscribe componentSubscriptionContainer', () => {
        const dummyIntegration: any = {
          dummy: 'integration',
        };
        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2]
        );

        subController.unsubscribe(componentSubscriptionContainer);

        expect(subController.componentSubs.size).toBe(0);
        expect(componentSubscriptionContainer.ready).toBeFalsy();
        expect(dummyObserver1.unsubscribe).toHaveBeenCalledWith(
          componentSubscriptionContainer
        );
        expect(dummyObserver2.unsubscribe).toHaveBeenCalledWith(
          componentSubscriptionContainer
        );
      });

      it('should unsubscribe componentSubscriptionContainer from passed Object that hold an instance of componentSubscriptionContainer', () => {
        const dummyIntegration: any = {
          dummy: 'integration',
        };
        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2]
        );

        subController.unsubscribe(dummyIntegration);

        expect(subController.componentSubs.size).toBe(0);
        expect(componentSubscriptionContainer.ready).toBeFalsy();
        expect(dummyObserver1.unsubscribe).toHaveBeenCalledWith(
          componentSubscriptionContainer
        );
        expect(dummyObserver2.unsubscribe).toHaveBeenCalledWith(
          componentSubscriptionContainer
        );
      });

      it('should unsubscribe componentSubscriptionContainers from passed Object that hold an Array of componentSubscriptionContainers', () => {
        const dummyIntegration: any = {
          dummy: 'integration',
          componentSubscriptionContainers: [],
        };
        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2]
        );
        const componentSubscriptionContainer2 = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2]
        );

        subController.unsubscribe(dummyIntegration);

        expect(subController.componentSubs.size).toBe(0);

        expect(componentSubscriptionContainer.ready).toBeFalsy();
        expect(dummyObserver1.unsubscribe).toHaveBeenCalledWith(
          componentSubscriptionContainer
        );
        expect(dummyObserver2.unsubscribe).toHaveBeenCalledWith(
          componentSubscriptionContainer
        );

        expect(componentSubscriptionContainer2.ready).toBeFalsy();
        expect(dummyObserver1.unsubscribe).toHaveBeenCalledWith(
          componentSubscriptionContainer2
        );
        expect(dummyObserver2.unsubscribe).toHaveBeenCalledWith(
          componentSubscriptionContainer2
        );
      });
    });

    describe('registerSubscription function tests', () => {
      let dummySubscriptionContainer: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer = new SubscriptionContainer();
        dummyAgile.config.waitForMount = 'dummyWaitForMount' as any;

        subController.registerCallbackSubscription = jest.fn(
          () => dummySubscriptionContainer as CallbackSubscriptionContainer
        );
        subController.registerComponentSubscription = jest.fn(
          () => dummySubscriptionContainer as ComponentSubscriptionContainer
        );
      });

      it('should call registerCallbackSubscription if passed integrationInstance is a Function (default config)', () => {
        const dummyIntegration = () => {
          /* empty function */
        };

        const subscriptionContainer = subController.registerSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2]
        );

        expect(subscriptionContainer).toBe(dummySubscriptionContainer);
        expect(
          subController.registerCallbackSubscription
        ).toHaveBeenCalledWith(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          { waitForMount: dummyAgile.config.waitForMount }
        );
        expect(
          subController.registerComponentSubscription
        ).not.toHaveBeenCalled();
      });

      it('should call registerCallbackSubscription if passed integrationInstance is a Function (specific config)', () => {
        const dummyIntegration = () => {
          /* empty function */
        };

        const subscriptionContainer = subController.registerSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          { key: 'niceKey', proxyKeyMap: {}, waitForMount: false }
        );

        expect(subscriptionContainer).toBe(dummySubscriptionContainer);
        expect(
          subController.registerCallbackSubscription
        ).toHaveBeenCalledWith(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          { key: 'niceKey', proxyKeyMap: {}, waitForMount: false }
        );
        expect(
          subController.registerComponentSubscription
        ).not.toHaveBeenCalled();
      });

      it('should call registerComponentSubscription if passed integrationInstance is not a Function (default config)', () => {
        const dummyIntegration = { dummy: 'integration' };

        const subscriptionContainer = subController.registerSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2]
        );

        expect(subscriptionContainer).toBe(dummySubscriptionContainer);
        expect(
          subController.registerComponentSubscription
        ).toHaveBeenCalledWith(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          { waitForMount: dummyAgile.config.waitForMount }
        );
        expect(
          subController.registerCallbackSubscription
        ).not.toHaveBeenCalled();
      });

      it('should call registerComponentSubscription if passed integrationInstance is not a Function (specific config)', () => {
        const dummyIntegration = { dummy: 'integration' };

        const subscriptionContainer = subController.registerSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          { key: 'niceKey', proxyKeyMap: {}, waitForMount: false }
        );

        expect(subscriptionContainer).toBe(dummySubscriptionContainer);
        expect(
          subController.registerComponentSubscription
        ).toHaveBeenCalledWith(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          { key: 'niceKey', proxyKeyMap: {}, waitForMount: false }
        );
        expect(
          subController.registerCallbackSubscription
        ).not.toHaveBeenCalled();
      });
    });

    describe('registerComponentSubscription function tests', () => {
      it('should return ready componentSubscriptionContainer and add it to dummyIntegration at componentSubscriptionContainer (config.waitForMount = false)', () => {
        const dummyIntegration: any = { dummy: 'integration' };

        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          { waitForMount: false }
        );

        expect(componentSubscriptionContainer).toBeInstanceOf(
          ComponentSubscriptionContainer
        );
        expect(componentSubscriptionContainer.component).toStrictEqual(
          dummyIntegration
        );
        expect(componentSubscriptionContainer.ready).toBeTruthy();

        expect(componentSubscriptionContainer.subscribers.size).toBe(2);
        expect(
          componentSubscriptionContainer.subscribers.has(dummyObserver1)
        ).toBeTruthy();
        expect(
          componentSubscriptionContainer.subscribers.has(dummyObserver2)
        ).toBeTruthy();

        expect(subController.componentSubs.size).toBe(1);
        expect(
          subController.componentSubs.has(componentSubscriptionContainer)
        ).toBeTruthy();

        expect(dummyIntegration.componentSubscriptionContainer).toBe(
          componentSubscriptionContainer
        );
      });

      it('should return ready componentSubscriptionContainer and add it to componentSubscriptions in dummyIntegration (config.waitForMount = false)', () => {
        const dummyIntegration: any = {
          dummy: 'integration',
          componentSubscriptionContainers: [],
        };

        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          { waitForMount: false }
        );

        expect(componentSubscriptionContainer).toBeInstanceOf(
          ComponentSubscriptionContainer
        );
        expect(componentSubscriptionContainer.component).toStrictEqual(
          dummyIntegration
        );
        expect(componentSubscriptionContainer.ready).toBeTruthy();

        expect(componentSubscriptionContainer.subscribers.size).toBe(2);
        expect(
          componentSubscriptionContainer.subscribers.has(dummyObserver1)
        ).toBeTruthy();
        expect(
          componentSubscriptionContainer.subscribers.has(dummyObserver2)
        ).toBeTruthy();

        expect(subController.componentSubs.size).toBe(1);
        expect(
          subController.componentSubs.has(componentSubscriptionContainer)
        ).toBeTruthy();

        expect(dummyIntegration.componentSubscriptionContainers.length).toBe(1);
        expect(dummyIntegration.componentSubscriptionContainers[0]).toBe(
          componentSubscriptionContainer
        );
        expect(dummyIntegration.componentSubscriptionContainer).toBeUndefined();
      });

      it("should return not ready componentSubscriptionContainer if componentInstance isn't mounted (waitForMount = true)", () => {
        const dummyIntegration: any = {
          dummy: 'integration',
        };

        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          { waitForMount: true }
        );

        expect(componentSubscriptionContainer).toBeInstanceOf(
          ComponentSubscriptionContainer
        );
        expect(componentSubscriptionContainer.component).toStrictEqual(
          dummyIntegration
        );
        expect(componentSubscriptionContainer.ready).toBeFalsy();

        expect(componentSubscriptionContainer.subscribers.size).toBe(2);
        expect(
          componentSubscriptionContainer.subscribers.has(dummyObserver1)
        ).toBeTruthy();
        expect(
          componentSubscriptionContainer.subscribers.has(dummyObserver2)
        ).toBeTruthy();

        expect(subController.componentSubs.size).toBe(1);
        expect(
          subController.componentSubs.has(componentSubscriptionContainer)
        ).toBeTruthy();
      });

      it('should return ready componentSubscriptionContainer if componentInstance is mounted (config.waitForMount = true)', () => {
        const dummyIntegration: any = {
          dummy: 'integration',
        };
        subController.mount(dummyIntegration);

        const componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          { waitForMount: true }
        );

        expect(componentSubscriptionContainer).toBeInstanceOf(
          ComponentSubscriptionContainer
        );
        expect(componentSubscriptionContainer.component).toStrictEqual(
          dummyIntegration
        );
        expect(componentSubscriptionContainer.ready).toBeTruthy();

        expect(componentSubscriptionContainer.subscribers.size).toBe(2);
        expect(
          componentSubscriptionContainer.subscribers.has(dummyObserver1)
        ).toBeTruthy();
        expect(
          componentSubscriptionContainer.subscribers.has(dummyObserver2)
        ).toBeTruthy();

        expect(subController.componentSubs.size).toBe(1);
        expect(
          subController.componentSubs.has(componentSubscriptionContainer)
        ).toBeTruthy();
      });
    });

    describe('registerCallbackSubscription function tests', () => {
      it('should return callbackSubscriptionContainer (default config)', () => {
        jest.spyOn(Utils, 'generateId').mockReturnValueOnce('randomKey');
        const dummyIntegration = () => {
          /* empty function */
        };

        const callbackSubscriptionContainer = subController.registerCallbackSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2]
        );

        expect(callbackSubscriptionContainer).toBeInstanceOf(
          CallbackSubscriptionContainer
        );
        expect(callbackSubscriptionContainer.callback).toBe(dummyIntegration);
        expect(callbackSubscriptionContainer.ready).toBeTruthy();

        // TODO find a way to spy on a class constructor without overwriting it
        // https://stackoverflow.com/questions/48219267/how-to-spy-on-a-class-constructor-jest/48486214
        // Because the below tests are not really related to this test,
        // they are checking if the CallbackSubscriptionContainer got called with the right parameters
        // by checking if CallbackSubscriptionContainer has set its properties correctly
        // Note:This 'issue' happens in multiple parts of the AgileTs test
        expect(callbackSubscriptionContainer.key).toBe('randomKey');
        expect(callbackSubscriptionContainer.proxyKeyMap).toStrictEqual({});
        expect(callbackSubscriptionContainer.proxyBased).toBeFalsy();

        expect(callbackSubscriptionContainer.subscribers.size).toBe(2);
        expect(
          callbackSubscriptionContainer.subscribers.has(dummyObserver1)
        ).toBeTruthy();
        expect(
          callbackSubscriptionContainer.subscribers.has(dummyObserver2)
        ).toBeTruthy();

        expect(subController.callbackSubs.size).toBe(1);
        expect(
          subController.callbackSubs.has(callbackSubscriptionContainer)
        ).toBeTruthy();
      });

      it('should return callbackSubscriptionContainer (specific config)', () => {
        const dummyIntegration = () => {
          /* empty function */
        };

        const callbackSubscriptionContainer = subController.registerCallbackSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2],
          {
            waitForMount: false,
            proxyKeyMap: { jeff: { paths: [[]] } },
            key: 'jeff',
          }
        );

        expect(callbackSubscriptionContainer).toBeInstanceOf(
          CallbackSubscriptionContainer
        );
        expect(callbackSubscriptionContainer.callback).toBe(dummyIntegration);
        expect(callbackSubscriptionContainer.ready).toBeTruthy();
        expect(callbackSubscriptionContainer.key).toBe('jeff');
        expect(callbackSubscriptionContainer.proxyKeyMap).toStrictEqual({
          jeff: { paths: [[]] },
        });
        expect(callbackSubscriptionContainer.proxyBased).toBeTruthy();

        expect(callbackSubscriptionContainer.subscribers.size).toBe(2);
        expect(
          callbackSubscriptionContainer.subscribers.has(dummyObserver1)
        ).toBeTruthy();
        expect(
          callbackSubscriptionContainer.subscribers.has(dummyObserver2)
        ).toBeTruthy();

        expect(subController.callbackSubs.size).toBe(1);
        expect(
          subController.callbackSubs.has(callbackSubscriptionContainer)
        ).toBeTruthy();
      });
    });

    describe('mount function tests', () => {
      const dummyIntegration: any = {
        dummy: 'integration',
      };
      let componentSubscriptionContainer: ComponentSubscriptionContainer;

      beforeEach(() => {
        dummyAgile.config.waitForMount = true;
        componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2]
        );
      });

      it('should add componentInstance to mountedComponents and set its subscriptionContainer to ready', () => {
        subController.mount(dummyIntegration);

        expect(componentSubscriptionContainer.ready).toBeTruthy();
        expect(subController.mountedComponents.size).toBe(1);
        expect(
          subController.mountedComponents.has(dummyIntegration)
        ).toBeTruthy();
      });
    });

    describe('unmount function tests', () => {
      const dummyIntegration: any = {
        dummy: 'integration',
      };
      let componentSubscriptionContainer: ComponentSubscriptionContainer;

      beforeEach(() => {
        dummyAgile.config.waitForMount = true;
        componentSubscriptionContainer = subController.registerComponentSubscription(
          dummyIntegration,
          [dummyObserver1, dummyObserver2]
        );
        subController.mount(dummyIntegration);
      });

      it('should remove componentInstance from mountedComponents and set its subscriptionContainer to not ready', () => {
        subController.unmount(dummyIntegration);

        expect(componentSubscriptionContainer.ready).toBeFalsy();
        expect(subController.mountedComponents.size).toBe(0);
      });
    });
  });
});
