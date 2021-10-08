import {
  Agile,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
  Observer,
  SubController,
} from '../../../../src';
import * as Utils from '@agile-ts/utils';
import { LogMock } from '../../../helper/logMock';

describe('SubController Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile();

    jest.clearAllMocks();
  });

  it('should create SubController', () => {
    const subController = new SubController(dummyAgile);

    expect(subController.agileInstance()).toBe(dummyAgile);
    expect(Array.from(subController.callbackSubs)).toStrictEqual([]);
    expect(Array.from(subController.componentSubs)).toStrictEqual([]);
  });

  describe('SubController Function Tests', () => {
    let subController: SubController;
    let dummyObserver1: Observer;
    let dummyObserver2: Observer;

    beforeEach(() => {
      dummyObserver1 = new Observer(dummyAgile, {
        key: 'dummyObserver1',
      });
      dummyObserver1['value'] = 'dummyObserver1Value';
      dummyObserver2 = new Observer(dummyAgile, {
        key: 'dummyObserver2',
      });
      dummyObserver2['value'] = 'dummyObserver2Value';
      subController = new SubController(dummyAgile);
    });

    describe('subscribe function tests', () => {
      beforeEach(() => {
        jest.spyOn(subController, 'createCallbackSubscriptionContainer');
        jest.spyOn(subController, 'createComponentSubscriptionContainer');
      });

      it(
        'should create a Component based Subscription Container with specified Component Instance ' +
          'and assign the in an object specified Observers to it',
        () => {
          dummyAgile.config.waitForMount = 'aFakeBoolean' as any;
          const dummyIntegration: any = {
            dummy: 'integration',
          };

          const returnValue = subController.subscribe(
            dummyIntegration,
            { observer1: dummyObserver1, observer2: dummyObserver2 },
            {
              key: 'subscriptionContainerKey',
              componentId: 'testID',
              waitForMount: true,
            }
          );

          expect(returnValue.subscriptionContainer).toBeInstanceOf(
            ComponentSubscriptionContainer
          );
          expect(returnValue.props).toStrictEqual({
            observer1: dummyObserver1['value'],
            observer2: dummyObserver2['value'],
          });

          expect(
            subController.createComponentSubscriptionContainer
          ).toHaveBeenCalledWith(
            dummyIntegration,
            { observer1: dummyObserver1, observer2: dummyObserver2 },
            {
              key: 'subscriptionContainerKey',
              componentId: 'testID',
              waitForMount: true,
            }
          );
          expect(
            subController.createCallbackSubscriptionContainer
          ).not.toHaveBeenCalled();
        }
      );

      it(
        'should create a Component based Subscription Container with specified Component Instance ' +
          'and assign the in an array specified Observers to it',
        () => {
          dummyAgile.config.waitForMount = 'aFakeBoolean' as any;
          const dummyIntegration: any = {
            dummy: 'integration',
          };

          const returnValue = subController.subscribe(
            dummyIntegration,
            [dummyObserver1, dummyObserver2],
            { key: 'subscriptionContainerKey', componentId: 'testID' }
          );

          expect(returnValue).toBeInstanceOf(ComponentSubscriptionContainer);

          expect(
            subController.createComponentSubscriptionContainer
          ).toHaveBeenCalledWith(
            dummyIntegration,
            [dummyObserver1, dummyObserver2],
            {
              key: 'subscriptionContainerKey',
              componentId: 'testID',
              waitForMount: 'aFakeBoolean',
            }
          );
          expect(
            subController.createCallbackSubscriptionContainer
          ).not.toHaveBeenCalled();
        }
      );

      it(
        'should create a Callback based Subscription Container with specified callback function ' +
          'and assign the in an object specified Observers to it',
        () => {
          dummyAgile.config.waitForMount = 'aFakeBoolean' as any;
          const dummyIntegration = () => {
            /* empty function */
          };

          const returnValue = subController.subscribe(
            dummyIntegration,
            { observer1: dummyObserver1, observer2: dummyObserver2 },
            {
              key: 'subscriptionContainerKey',
              componentId: 'testID',
            }
          );

          expect(returnValue.subscriptionContainer).toBeInstanceOf(
            CallbackSubscriptionContainer
          );
          expect(returnValue.props).toStrictEqual({
            observer1: dummyObserver1['value'],
            observer2: dummyObserver2['value'],
          });

          expect(
            subController.createCallbackSubscriptionContainer
          ).toHaveBeenCalledWith(
            dummyIntegration,
            { observer1: dummyObserver1, observer2: dummyObserver2 },
            {
              key: 'subscriptionContainerKey',
              componentId: 'testID',
              waitForMount: 'aFakeBoolean',
            }
          );
          expect(
            subController.createComponentSubscriptionContainer
          ).not.toHaveBeenCalled();
        }
      );

      it(
        'should create a Callback based Subscription Container with specified callback function ' +
          'and assign the in an array specified Observers to it',
        () => {
          dummyAgile.config.waitForMount = 'aFakeBoolean' as any;
          const dummyIntegration = () => {
            /* empty function */
          };

          const returnValue = subController.subscribe(
            dummyIntegration,
            [dummyObserver1, dummyObserver2],
            {
              key: 'subscriptionContainerKey',
              componentId: 'testID',
              waitForMount: false,
            }
          );

          expect(returnValue).toBeInstanceOf(CallbackSubscriptionContainer);

          expect(
            subController.createCallbackSubscriptionContainer
          ).toHaveBeenCalledWith(
            dummyIntegration,
            [dummyObserver1, dummyObserver2],
            {
              key: 'subscriptionContainerKey',
              componentId: 'testID',
              waitForMount: false,
            }
          );
          expect(
            subController.createComponentSubscriptionContainer
          ).not.toHaveBeenCalled();
        }
      );
    });

    describe('unsubscribe function tests', () => {
      it('should unsubscribe Callback based Subscription Container', () => {
        const dummyIntegration = () => {
          /* empty function */
        };
        const callbackSubscriptionContainer =
          subController.createCallbackSubscriptionContainer(dummyIntegration, [
            dummyObserver1,
            dummyObserver2,
          ]);
        callbackSubscriptionContainer.removeSubscription = jest.fn();

        subController.unsubscribe(callbackSubscriptionContainer);

        expect(Array.from(subController.callbackSubs)).toStrictEqual([]);
        expect(callbackSubscriptionContainer.ready).toBeFalsy();
        expect(
          callbackSubscriptionContainer.removeSubscription
        ).toHaveBeenCalledTimes(2);
        expect(
          callbackSubscriptionContainer.removeSubscription
        ).toHaveBeenCalledWith(dummyObserver1);
        expect(
          callbackSubscriptionContainer.removeSubscription
        ).toHaveBeenCalledWith(dummyObserver2);
      });

      it('should unsubscribe Component Subscription Container', () => {
        const dummyIntegration: any = {
          dummy: 'integration',
        };
        const componentSubscriptionContainer =
          subController.createComponentSubscriptionContainer(dummyIntegration, [
            dummyObserver1,
            dummyObserver2,
          ]);
        componentSubscriptionContainer.removeSubscription = jest.fn();

        subController.unsubscribe(componentSubscriptionContainer);

        expect(Array.from(subController.componentSubs)).toStrictEqual([]);
        expect(componentSubscriptionContainer.ready).toBeFalsy();
        expect(
          componentSubscriptionContainer.removeSubscription
        ).toHaveBeenCalledTimes(2);
        expect(
          componentSubscriptionContainer.removeSubscription
        ).toHaveBeenCalledWith(dummyObserver1);
        expect(
          componentSubscriptionContainer.removeSubscription
        ).toHaveBeenCalledWith(dummyObserver2);
      });

      it(
        'should unsubscribe Component based Subscription Container ' +
          'from specified object (UI-Component) that contains an instance of the Component Subscription Container',
        () => {
          const dummyIntegration: any = {
            dummy: 'integration',
            componentSubscriptionContainers: [],
          };
          const componentSubscriptionContainer =
            subController.createComponentSubscriptionContainer(
              dummyIntegration,
              [dummyObserver1, dummyObserver2]
            );
          componentSubscriptionContainer.removeSubscription = jest.fn();
          const componentSubscriptionContainer2 =
            subController.createComponentSubscriptionContainer(
              dummyIntegration,
              [dummyObserver1, dummyObserver2]
            );
          componentSubscriptionContainer2.removeSubscription = jest.fn();

          subController.unsubscribe(dummyIntegration);

          expect(Array.from(subController.componentSubs)).toStrictEqual([]);

          expect(componentSubscriptionContainer.ready).toBeFalsy();
          expect(
            componentSubscriptionContainer.removeSubscription
          ).toHaveBeenCalledTimes(2);
          expect(
            componentSubscriptionContainer.removeSubscription
          ).toHaveBeenCalledWith(dummyObserver1);
          expect(
            componentSubscriptionContainer.removeSubscription
          ).toHaveBeenCalledWith(dummyObserver2);

          expect(componentSubscriptionContainer2.ready).toBeFalsy();
          expect(
            componentSubscriptionContainer2.removeSubscription
          ).toHaveBeenCalledTimes(2);
          expect(
            componentSubscriptionContainer2.removeSubscription
          ).toHaveBeenCalledWith(dummyObserver1);
          expect(
            componentSubscriptionContainer2.removeSubscription
          ).toHaveBeenCalledWith(dummyObserver2);
        }
      );
    });

    describe('createComponentSubscriptionContainer function tests', () => {
      it(
        'should return ready Component based Subscription Container ' +
          "and add an instance of it to the not existing 'componentSubscriptions' property " +
          'in the dummyIntegration (default config)',
        () => {
          jest.spyOn(Utils, 'generateId').mockReturnValueOnce('generatedKey');
          const dummyIntegration: any = {
            dummy: 'integration',
          };

          const componentSubscriptionContainer =
            subController.createComponentSubscriptionContainer(
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

          expect(Array.from(subController.componentSubs)).toStrictEqual([
            componentSubscriptionContainer,
          ]);

          expect(
            dummyIntegration.componentSubscriptionContainers
          ).toStrictEqual([componentSubscriptionContainer]);

          // Check if ComponentSubscriptionContainer was called with correct parameters
          expect(componentSubscriptionContainer.key).toBe('generatedKey');
          expect(componentSubscriptionContainer.componentId).toBeUndefined();
          expect(
            Array.from(componentSubscriptionContainer.subscribers)
          ).toStrictEqual([dummyObserver1, dummyObserver2]);
        }
      );

      it(
        'should return ready Component based Subscription Container ' +
          "and add an instance of it to the existing 'componentSubscriptions' property " +
          'in the dummyIntegration (default config)',
        () => {
          jest.spyOn(Utils, 'generateId').mockReturnValueOnce('generatedKey');
          const dummyIntegration: any = {
            dummy: 'integration',
            componentSubscriptionContainers: [],
          };

          const componentSubscriptionContainer =
            subController.createComponentSubscriptionContainer(
              dummyIntegration,
              [dummyObserver1, dummyObserver2],
              { waitForMount: false }
            );

          expect(
            dummyIntegration.componentSubscriptionContainers
          ).toStrictEqual([componentSubscriptionContainer]);
        }
      );

      it(
        'should return ready Component based Subscription Container ' +
          "and add an instance of it to the not existing 'componentSubscriptions' property " +
          'in the dummyIntegration (specific config)',
        () => {
          const dummyIntegration: any = {
            dummy: 'integration',
          };

          const componentSubscriptionContainer =
            subController.createComponentSubscriptionContainer(
              dummyIntegration,
              [dummyObserver1, dummyObserver2],
              { waitForMount: false, componentId: 'testID', key: 'dummyKey' }
            );

          expect(componentSubscriptionContainer).toBeInstanceOf(
            ComponentSubscriptionContainer
          );
          expect(componentSubscriptionContainer.component).toStrictEqual(
            dummyIntegration
          );
          expect(componentSubscriptionContainer.ready).toBeTruthy();

          expect(Array.from(subController.componentSubs)).toStrictEqual([
            componentSubscriptionContainer,
          ]);

          expect(
            dummyIntegration.componentSubscriptionContainers
          ).toStrictEqual([componentSubscriptionContainer]);

          // Check if ComponentSubscriptionContainer was called with correct parameters
          expect(componentSubscriptionContainer.key).toBe('dummyKey');
          expect(componentSubscriptionContainer.componentId).toBe('testID');
          expect(
            Array.from(componentSubscriptionContainer.subscribers)
          ).toStrictEqual([dummyObserver1, dummyObserver2]);
        }
      );

      it("should return not ready Component based Subscription Container if componentInstance isn't mounted (config.waitForMount = true)", () => {
        jest.spyOn(Utils, 'generateId').mockReturnValueOnce('generatedKey');
        const dummyIntegration: any = {
          dummy: 'integration',
        };

        const componentSubscriptionContainer =
          subController.createComponentSubscriptionContainer(
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

        expect(Array.from(subController.componentSubs)).toStrictEqual([
          componentSubscriptionContainer,
        ]);

        // Check if ComponentSubscriptionContainer was called with correct parameters
        expect(componentSubscriptionContainer.key).toBe('generatedKey');
        expect(componentSubscriptionContainer.componentId).toBeUndefined();
        expect(
          Array.from(componentSubscriptionContainer.subscribers)
        ).toStrictEqual([dummyObserver1, dummyObserver2]);
      });

      it('should return ready Component based Subscription Container if componentInstance is mounted (config.waitForMount = true)', () => {
        jest.spyOn(Utils, 'generateId').mockReturnValueOnce('generatedKey');
        const dummyIntegration: any = {
          dummy: 'integration',
        };
        subController.mount(dummyIntegration);

        const componentSubscriptionContainer =
          subController.createComponentSubscriptionContainer(
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

        expect(Array.from(subController.componentSubs)).toStrictEqual([
          componentSubscriptionContainer,
        ]);

        // Check if ComponentSubscriptionContainer was called with correct parameters
        expect(componentSubscriptionContainer.key).toBe('generatedKey');
        expect(componentSubscriptionContainer.componentId).toBeUndefined();
        expect(
          Array.from(componentSubscriptionContainer.subscribers)
        ).toStrictEqual([dummyObserver1, dummyObserver2]);
      });
    });

    describe('registerCallbackSubscription function tests', () => {
      it('should return Callback based Subscription Container (default config)', () => {
        jest.spyOn(Utils, 'generateId').mockReturnValueOnce('generatedKey');
        const dummyIntegration = () => {
          /* empty function */
        };

        const callbackSubscriptionContainer =
          subController.createCallbackSubscriptionContainer(dummyIntegration, [
            dummyObserver1,
            dummyObserver2,
          ]);

        expect(callbackSubscriptionContainer).toBeInstanceOf(
          CallbackSubscriptionContainer
        );
        expect(callbackSubscriptionContainer.callback).toBe(dummyIntegration);
        expect(callbackSubscriptionContainer.ready).toBeTruthy();

        expect(Array.from(subController.callbackSubs)).toStrictEqual([
          callbackSubscriptionContainer,
        ]);

        // TODO find a way to spy on a class constructor without overwriting it.
        // https://stackoverflow.com/questions/48219267/how-to-spy-on-a-class-constructor-jest/48486214
        // Because the below tests are not really related to this test.
        // They are checking if the CallbackSubscriptionContainer was called with the correct parameters
        // by checking if the CallbackSubscriptionContainer has correctly set properties.
        // Note: This 'issue' happens in multiple parts of the AgileTs test!
        expect(callbackSubscriptionContainer.key).toBe('generatedKey');
        expect(callbackSubscriptionContainer.componentId).toBeUndefined();
        expect(
          Array.from(callbackSubscriptionContainer.subscribers)
        ).toStrictEqual([dummyObserver1, dummyObserver2]);
      });

      it('should return Callback based Subscription Container (specific config)', () => {
        const dummyIntegration = () => {
          /* empty function */
        };

        const callbackSubscriptionContainer =
          subController.createCallbackSubscriptionContainer(
            dummyIntegration,
            [dummyObserver1, dummyObserver2],
            {
              waitForMount: false,
              componentId: 'testID',
              key: 'dummyKey',
            }
          );

        expect(callbackSubscriptionContainer).toBeInstanceOf(
          CallbackSubscriptionContainer
        );
        expect(callbackSubscriptionContainer.callback).toBe(dummyIntegration);
        expect(callbackSubscriptionContainer.ready).toBeTruthy();

        expect(Array.from(subController.callbackSubs)).toStrictEqual([
          callbackSubscriptionContainer,
        ]);

        // Check if CallbackSubscriptionContainer was called with correct parameters
        expect(callbackSubscriptionContainer.key).toBe('dummyKey');
        expect(callbackSubscriptionContainer.componentId).toBe('testID');
        expect(
          Array.from(callbackSubscriptionContainer.subscribers)
        ).toStrictEqual([dummyObserver1, dummyObserver2]);
      });
    });

    describe('mount function tests', () => {
      const dummyIntegration: any = {
        dummy: 'integration',
      };
      let componentSubscriptionContainer: ComponentSubscriptionContainer;

      beforeEach(() => {
        dummyAgile.config.waitForMount = true;
        componentSubscriptionContainer =
          subController.createComponentSubscriptionContainer(dummyIntegration, [
            dummyObserver1,
            dummyObserver2,
          ]);
      });

      it(
        "should add specified 'componentInstance' to the 'mountedComponents' " +
          'and set the Subscription Container representing the mounted Component to ready',
        () => {
          subController.mount(dummyIntegration);

          expect(componentSubscriptionContainer.ready).toBeTruthy();
          expect(Array.from(subController.mountedComponents)).toStrictEqual([
            dummyIntegration,
          ]);
        }
      );
    });

    describe('unmount function tests', () => {
      const dummyIntegration: any = {
        dummy: 'integration',
      };
      let componentSubscriptionContainer: ComponentSubscriptionContainer;

      beforeEach(() => {
        dummyAgile.config.waitForMount = true;
        componentSubscriptionContainer =
          subController.createComponentSubscriptionContainer(dummyIntegration, [
            dummyObserver1,
            dummyObserver2,
          ]);
        subController.mount(dummyIntegration);
      });

      it(
        "should remove specified 'componentInstance' to the 'mountedComponents' " +
          'and set the Subscription Container representing the mounted Component to not ready',
        () => {
          subController.unmount(dummyIntegration);

          expect(componentSubscriptionContainer.ready).toBeFalsy();
          expect(Array.from(subController.mountedComponents)).toStrictEqual([]);
        }
      );
    });
  });
});
