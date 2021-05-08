import {
  Agile,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
  RuntimeJob,
  Observer,
  Runtime,
  SubscriptionContainer,
} from '../../../src';
import * as Utils from '../../../src/utils';
import testIntegration from '../../helper/test.integration';
import mockConsole from 'jest-mock-console';

describe('Runtime Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole(['error', 'warn']);

    dummyAgile = new Agile({ localStorage: false });

    console.warn = jest.fn();
  });

  it('should create Runtime', () => {
    const runtime = new Runtime(dummyAgile);

    expect(runtime.currentJob).toBeNull();
    expect(runtime.jobQueue).toStrictEqual([]);
    expect(runtime.notReadyJobsToRerender.size).toBe(0);
    expect(runtime.jobsToRerender).toStrictEqual([]);
  });

  describe('Runtime Function Tests', () => {
    let runtime: Runtime;
    let dummyObserver1: Observer;
    let dummyObserver2: Observer;
    let dummyObserver3: Observer;

    beforeEach(() => {
      runtime = new Runtime(dummyAgile);
      dummyObserver1 = new Observer(dummyAgile, { key: 'dummyObserver1' });
      dummyObserver2 = new Observer(dummyAgile, { key: 'dummyObserver2' });
      dummyObserver3 = new Observer(dummyAgile, { key: 'dummyObserver3' });
    });

    describe('ingest function tests', () => {
      let dummyJob: RuntimeJob;

      beforeEach(() => {
        dummyJob = new RuntimeJob(dummyObserver1);

        runtime.perform = jest.fn();
      });

      it('should perform passed Job (default config)', () => {
        runtime.ingest(dummyJob);

        expect(runtime.jobQueue.length).toBe(0);
        expect(runtime.perform).toHaveBeenCalledWith(dummyJob);
      });

      it("shouldn't perform passed Job (config.perform = false)", () => {
        runtime.ingest(dummyJob, { perform: false });

        expect(runtime.jobQueue.length).toBe(1);
        expect(runtime.jobQueue[0]).toBe(dummyJob);
        expect(runtime.perform).not.toHaveBeenCalled();
      });
    });

    describe('perform function tests', () => {
      let dummyJob1: RuntimeJob;
      let dummyJob2: RuntimeJob;
      let dummyJob3: RuntimeJob;

      beforeEach(() => {
        dummyJob1 = new RuntimeJob(dummyObserver1, { key: 'dummyJob1' });
        dummyJob2 = new RuntimeJob(dummyObserver2, { key: 'dummyJob2' });
        dummyJob3 = new RuntimeJob(dummyObserver1, { key: 'dummyJob3' });
        dummyJob1.rerender = true;
        dummyJob2.rerender = true;
        dummyJob3.rerender = false;

        runtime.updateSubscribers = jest.fn();
        jest.spyOn(dummyObserver1, 'perform');
        jest.spyOn(dummyObserver2, 'perform');
        dummyObserver1.ingest = jest.fn();
        dummyObserver2.ingest = jest.fn();
      });

      it('should perform passed and all in jobQueue remaining Jobs and call updateSubscribers', async () => {
        runtime.jobQueue.push(dummyJob2);
        runtime.jobQueue.push(dummyJob3);

        runtime.perform(dummyJob1);

        expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob1);
        expect(dummyJob1.performed).toBeTruthy();
        expect(dummyObserver2.perform).toHaveBeenCalledWith(dummyJob2);
        expect(dummyJob2.performed).toBeTruthy();
        expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob3);
        expect(dummyJob3.performed).toBeTruthy();

        expect(runtime.jobQueue.length).toBe(0);
        expect(runtime.jobsToRerender.length).toBe(2);
        expect(runtime.jobsToRerender.includes(dummyJob1)).toBeTruthy();
        expect(runtime.jobsToRerender.includes(dummyJob2)).toBeTruthy();
        expect(runtime.jobsToRerender.includes(dummyJob3)).toBeFalsy();

        // Sleep 5ms because updateSubscribers get called in Timeout
        await new Promise((resolve) => setTimeout(resolve, 5));

        expect(runtime.updateSubscribers).toHaveBeenCalledTimes(1);
      });

      it('should perform passed Job and update it dependents', async () => {
        dummyJob1.observer.dependents.add(dummyObserver2);
        dummyJob1.observer.dependents.add(dummyObserver1);

        runtime.perform(dummyJob1);

        expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob1);
        expect(dummyJob1.performed).toBeTruthy();

        expect(dummyObserver1.ingest).toHaveBeenCalledWith({
          perform: false,
        });
        expect(dummyObserver1.ingest).toHaveBeenCalledTimes(1);
        expect(dummyObserver2.ingest).toHaveBeenCalledWith({
          perform: false,
        });
        expect(dummyObserver2.ingest).toHaveBeenCalledTimes(1);
      });

      it("should perform passed and all in jobQueue remaining Jobs and shouldn't call updateSubscribes if no job needs to rerender", async () => {
        dummyJob1.rerender = false;
        runtime.jobQueue.push(dummyJob3);

        runtime.perform(dummyJob1);

        expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob1);
        expect(dummyJob1.performed).toBeTruthy();
        expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob3);
        expect(dummyJob3.performed).toBeTruthy();

        expect(runtime.jobQueue.length).toBe(0);
        expect(runtime.jobsToRerender.length).toBe(0);

        // Sleep 5ms because updateSubscribers get called in Timeout
        await new Promise((resolve) => setTimeout(resolve, 5));

        expect(runtime.updateSubscribers).not.toHaveBeenCalled();
      });
    });

    describe('updateSubscribers function tests', () => {
      let dummyObserver4: Observer;
      let rCallbackSubJob: RuntimeJob;
      let nrArCallbackSubJob: RuntimeJob;
      let rComponentSubJob: RuntimeJob;
      let nrArComponentSubJob: RuntimeJob;
      let rCallbackSubContainer: CallbackSubscriptionContainer;
      const rCallbackSubContainerCallbackFunction = () => {
        /* empty function */
      };
      let nrCallbackSubContainer: CallbackSubscriptionContainer;
      const nrCallbackSubContainerCallbackFunction = () => {
        /* empty function */
      };
      let rComponentSubContainer: ComponentSubscriptionContainer;
      const rComponentSubContainerComponent = {
        my: 'cool component',
      };
      let nrComponentSubContainer: ComponentSubscriptionContainer;
      const nrComponentSubContainerComponent = {
        my: 'second cool component',
      };
      const dummyProxyKeyMap = { myState: { paths: [['a', 'b']] } };

      beforeEach(() => {
        dummyAgile.integrate(testIntegration);
        dummyObserver4 = new Observer(dummyAgile, { key: 'dummyObserver4' });

        dummyObserver1.value = 'dummyObserverValue1';
        dummyObserver2.value = 'dummyObserverValue2';
        dummyObserver3.value = 'dummyObserverValue3';
        dummyObserver4.value = 'dummyObserverValue4';

        // Create Ready Callback Subscription
        rCallbackSubContainer = dummyAgile.subController.subscribeWithSubsArray(
          rCallbackSubContainerCallbackFunction,
          [dummyObserver1, dummyObserver2]
        ) as CallbackSubscriptionContainer;
        rCallbackSubContainer.callback = jest.fn();
        rCallbackSubContainer.ready = true;

        // Create Not Ready Callback Subscription
        nrCallbackSubContainer = dummyAgile.subController.subscribeWithSubsArray(
          nrCallbackSubContainerCallbackFunction,
          [dummyObserver2]
        ) as CallbackSubscriptionContainer;
        nrCallbackSubContainer.callback = jest.fn();
        nrCallbackSubContainer.ready = false;

        // Create Ready Component Subscription
        rComponentSubContainer = dummyAgile.subController.subscribeWithSubsObject(
          rComponentSubContainerComponent,
          {
            observer3: dummyObserver3,
            observer4: dummyObserver4,
          }
        ).subscriptionContainer as ComponentSubscriptionContainer;
        rComponentSubContainer.ready = true;

        // Create Not Ready Component Subscription
        nrComponentSubContainer = dummyAgile.subController.subscribeWithSubsObject(
          nrComponentSubContainerComponent,
          {
            observer4: dummyObserver4,
          }
        ).subscriptionContainer as ComponentSubscriptionContainer;
        nrComponentSubContainer.ready = false;

        rComponentSubJob = new RuntimeJob(dummyObserver3, { key: 'dummyJob3' }); // Job with ready Component Subscription
        rCallbackSubJob = new RuntimeJob(dummyObserver1, { key: 'dummyJob1' }); // Job with ready CallbackSubscription
        nrArComponentSubJob = new RuntimeJob(dummyObserver4, {
          key: 'dummyJob4',
        }); // Job with not ready and ready Component Subscription
        nrArCallbackSubJob = new RuntimeJob(dummyObserver2, {
          key: 'dummyJob2',
        }); // Job with not ready and ready Callback Subscription

        jest.spyOn(dummyAgile.integrations, 'update');
        jest.spyOn(runtime, 'handleObjectBasedSubscription');
        jest.spyOn(runtime, 'handleProxyBasedSubscription');
      });

      it('should return false if agile has no integration', () => {
        dummyAgile.hasIntegration = jest.fn(() => false);
        runtime.jobsToRerender.push(rCallbackSubJob);
        runtime.jobsToRerender.push(nrArCallbackSubJob);

        const response = runtime.updateSubscribers();

        expect(response).toBeFalsy();
        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);
        expect(dummyAgile.integrations.update).not.toHaveBeenCalled();
        expect(rCallbackSubContainer.callback).not.toHaveBeenCalled();
        expect(nrCallbackSubContainer.callback).not.toHaveBeenCalled();
      });

      it('should return false if no Jobs in jobsToRerender and notReadyJobsToRerender left', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.jobsToRerender = [];
        runtime.notReadyJobsToRerender = new Set();

        const response = runtime.updateSubscribers();

        expect(response).toBeFalsy();
      });

      it('should update ready component based SubscriptionContainer', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.jobsToRerender.push(rComponentSubJob);

        const response = runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);
        expect(runtime.handleProxyBasedSubscription).not.toHaveBeenCalled();

        expect(dummyAgile.integrations.update).toHaveBeenCalledTimes(1);
        expect(dummyAgile.integrations.update).toHaveBeenCalledWith(
          rComponentSubContainerComponent,
          {
            observer3: 'dummyObserverValue3',
          }
        );
        expect(runtime.handleObjectBasedSubscription).toHaveBeenCalledWith(
          rComponentSubContainer,
          rComponentSubJob
        );
        expect(rComponentSubJob.subscriptionContainersToUpdate.size).toBe(0);
        expect(dummyObserver3.subs.size).toBe(1);

        expect(response).toBeTruthy();
      });

      it('should update ready callback based SubscriptionContainer', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.jobsToRerender.push(rCallbackSubJob);

        const response = runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);
        expect(runtime.handleProxyBasedSubscription).not.toHaveBeenCalled();

        expect(rCallbackSubContainer.callback).toHaveBeenCalledTimes(1);
        expect(rCallbackSubJob.subscriptionContainersToUpdate.size).toBe(0);
        expect(dummyObserver1.subs.size).toBe(1);

        expect(response).toBeTruthy();
      });

      it('should update ready proxy, callback based SubscriptionContainer if handleProxyBasedSubscriptions() returns true', () => {
        jest
          .spyOn(runtime, 'handleProxyBasedSubscription')
          .mockReturnValueOnce(true);
        dummyAgile.hasIntegration = jest.fn(() => true);
        rCallbackSubContainer.proxyBased = true;
        rCallbackSubContainer.proxyKeyMap = dummyProxyKeyMap;
        runtime.jobsToRerender.push(rCallbackSubJob);

        const response = runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);
        expect(runtime.handleProxyBasedSubscription).toHaveBeenCalledWith(
          rCallbackSubContainer,
          rCallbackSubJob
        );

        expect(rCallbackSubContainer.callback).toHaveBeenCalledTimes(1);
        expect(rCallbackSubJob.subscriptionContainersToUpdate.size).toBe(0);
        expect(dummyObserver1.subs.size).toBe(1);

        expect(response).toBeTruthy();
      });

      it("shouldn't update ready proxy, callback based SubscriptionContainer if handleProxyBasedSubscriptions() returns false", () => {
        jest
          .spyOn(runtime, 'handleProxyBasedSubscription')
          .mockReturnValueOnce(false);
        dummyAgile.hasIntegration = jest.fn(() => true);
        rCallbackSubContainer.proxyBased = true;
        rCallbackSubContainer.proxyKeyMap = dummyProxyKeyMap;
        runtime.jobsToRerender.push(rCallbackSubJob);

        const response = runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);
        expect(runtime.handleProxyBasedSubscription).toHaveBeenCalledWith(
          rCallbackSubContainer,
          rCallbackSubJob
        );

        expect(rCallbackSubContainer.callback).not.toHaveBeenCalled();
        expect(rCallbackSubJob.subscriptionContainersToUpdate.size).toBe(0);
        expect(dummyObserver1.subs.size).toBe(1);

        expect(response).toBeFalsy();
      });

      it("shouldn't update not ready SubscriptionContainers but it should update ready SubscriptionContainers", () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.jobsToRerender.push(nrArCallbackSubJob);
        runtime.jobsToRerender.push(nrArComponentSubJob);

        const response = runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(2);
        expect(
          runtime.notReadyJobsToRerender.has(nrArCallbackSubJob)
        ).toBeTruthy();
        expect(
          runtime.notReadyJobsToRerender.has(nrArComponentSubJob)
        ).toBeTruthy();

        expect(nrArCallbackSubJob.subscriptionContainersToUpdate.size).toBe(1);
        expect(
          nrArCallbackSubJob.subscriptionContainersToUpdate.has(
            nrCallbackSubContainer
          )
        ).toBeTruthy();
        expect(nrArComponentSubJob.subscriptionContainersToUpdate.size).toBe(1);
        expect(
          nrArComponentSubJob.subscriptionContainersToUpdate.has(
            nrComponentSubContainer
          )
        ).toBeTruthy();

        expect(rCallbackSubContainer.callback).toHaveBeenCalledTimes(1);
        expect(nrCallbackSubContainer.callback).not.toHaveBeenCalled();

        expect(dummyAgile.integrations.update).toHaveBeenCalledTimes(1);
        expect(dummyAgile.integrations.update).toHaveBeenCalledWith(
          rComponentSubContainerComponent,
          {
            observer4: 'dummyObserverValue4',
          }
        );
        expect(dummyAgile.integrations.update).not.toHaveBeenCalledWith(
          nrComponentSubContainerComponent,
          {
            observer4: 'dummyObserverValue4',
          }
        );

        expect(dummyObserver2.subs.size).toBe(2);
        expect(dummyObserver4.subs.size).toBe(2);

        expect(runtime.handleObjectBasedSubscription).toHaveBeenCalledWith(
          rComponentSubContainer,
          nrArComponentSubJob
        );
        expect(runtime.handleObjectBasedSubscription).not.toHaveBeenCalledWith(
          nrComponentSubContainer,
          nrArComponentSubJob
        );

        expect(nrArComponentSubJob.triesToUpdate).toBe(1);
        expect(nrArCallbackSubJob.triesToUpdate).toBe(1);

        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: SubscriptionContainer/Component isn't ready to rerender!",
          nrCallbackSubContainer
        );
        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: SubscriptionContainer/Component isn't ready to rerender!",
          nrComponentSubContainer
        );

        expect(response).toBeTruthy(); // because 2 SubscriptionContainer were ready
      });

      it('should try to update in the past not ready SubscriptionContainers from the notReadyJobsToUpdate queue', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.notReadyJobsToRerender.add(rCallbackSubJob);

        const response = runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);

        expect(rCallbackSubContainer.callback).toHaveBeenCalled();
        expect(rCallbackSubJob.subscriptionContainersToUpdate.size).toBe(0);
        expect(dummyObserver1.subs.size).toBe(1);

        expect(response).toBeTruthy();
      });

      it(
        "shouldn't update not ready SubscriptionContainers from the notReadyJobsToUpdate queue " +
          'and completely remove them from the runtime when it exceeded numberOfTriesToUpdate',
        () => {
          dummyAgile.hasIntegration = jest.fn(() => true);
          rCallbackSubJob.config.numberOfTriesToUpdate = 2;
          rCallbackSubJob.triesToUpdate = 2;
          rCallbackSubContainer.ready = false;
          runtime.notReadyJobsToRerender.add(rCallbackSubJob);

          const response = runtime.updateSubscribers();

          expect(runtime.jobsToRerender).toStrictEqual([]);
          expect(runtime.notReadyJobsToRerender.size).toBe(0);

          expect(rCallbackSubContainer.callback).not.toHaveBeenCalled();
          expect(rCallbackSubJob.subscriptionContainersToUpdate.size).toBe(1);
          expect(
            rCallbackSubJob.subscriptionContainersToUpdate.has(
              rCallbackSubContainer
            )
          ).toBeTruthy();
          expect(dummyObserver1.subs.size).toBe(1);
          expect(rCallbackSubJob.triesToUpdate).toBe(2);

          expect(console.warn).toHaveBeenCalledWith(
            'Agile Warn: Job with not ready SubscriptionContainer/Component was removed from the runtime after 2 tries to avoid an overflow.',
            rCallbackSubContainer
          );

          expect(response).toBeFalsy();
        }
      );

      it(
        "shouldn't update not ready SubscriptionContainer from the notReadyJobsToUpdate queue " +
          'and add it again to the notReadyJobsToUpdate queue if numberOfTriesToUpdate is null',
        () => {
          dummyAgile.hasIntegration = jest.fn(() => true);
          rCallbackSubJob.config.numberOfTriesToUpdate = null;
          rCallbackSubJob.triesToUpdate = 2;
          rCallbackSubContainer.ready = false;
          runtime.notReadyJobsToRerender.add(rCallbackSubJob);

          const response = runtime.updateSubscribers();

          expect(runtime.jobsToRerender).toStrictEqual([]);
          expect(runtime.notReadyJobsToRerender.size).toBe(1);
          expect(
            runtime.notReadyJobsToRerender.has(rCallbackSubJob)
          ).toBeTruthy();

          expect(rCallbackSubContainer.callback).not.toHaveBeenCalled();
          expect(rCallbackSubJob.subscriptionContainersToUpdate.size).toBe(1);
          expect(
            rCallbackSubJob.subscriptionContainersToUpdate.has(
              rCallbackSubContainer
            )
          ).toBeTruthy();
          expect(dummyObserver1.subs.size).toBe(1);
          expect(rCallbackSubJob.triesToUpdate).toBe(3);

          expect(console.warn).toHaveBeenCalledWith(
            "Agile Warn: SubscriptionContainer/Component isn't ready to rerender!",
            rCallbackSubContainer
          );

          expect(response).toBeFalsy();
        }
      );
    });

    describe('handleObjectBasedSubscription function tests', () => {
      let arraySubscriptionContainer: SubscriptionContainer;
      const dummyComponent = {
        my: 'cool component',
      };
      let objectSubscriptionContainer: SubscriptionContainer;
      const dummyComponent2 = {
        my: 'second cool component',
      };
      let arrayJob: RuntimeJob;
      let objectJob1: RuntimeJob;
      let objectJob2: RuntimeJob;

      beforeEach(() => {
        arraySubscriptionContainer = dummyAgile.subController.subscribeWithSubsArray(
          dummyComponent,
          [dummyObserver1, dummyObserver2, dummyObserver3]
        );
        arrayJob = new RuntimeJob(dummyObserver1, { key: 'dummyArrayJob' });

        objectSubscriptionContainer = dummyAgile.subController.subscribeWithSubsObject(
          dummyComponent2,
          {
            observer1: dummyObserver1,
            observer2: dummyObserver2,
            observer3: dummyObserver3,
          }
        ).subscriptionContainer;
        objectJob1 = new RuntimeJob(dummyObserver1, { key: 'dummyObjectJob1' });
        objectJob2 = new RuntimeJob(dummyObserver3, { key: 'dummyObjectJob2' });
      });

      it('should ignore not object based SubscriptionContainer', () => {
        runtime.handleObjectBasedSubscription(
          arraySubscriptionContainer,
          arrayJob
        );

        expect(arraySubscriptionContainer.observerKeysToUpdate).toStrictEqual(
          []
        );
      });

      it('should add Job Observer to changedObjectKeys in SubscriptionContainer', () => {
        runtime.handleObjectBasedSubscription(
          objectSubscriptionContainer,
          objectJob1
        );

        expect(objectSubscriptionContainer.observerKeysToUpdate).toStrictEqual([
          'observer1',
        ]);
      });
    });

    describe('getObjectBasedProps function tests', () => {
      let subscriptionContainer: SubscriptionContainer;
      const dummyFunction = () => {
        /* empty function */
      };

      beforeEach(() => {
        subscriptionContainer = dummyAgile.subController.subscribeWithSubsObject(
          dummyFunction,
          {
            observer1: dummyObserver1,
            observer2: dummyObserver2,
            observer3: dummyObserver3,
          }
        ).subscriptionContainer;
        dummyObserver1.value = 'dummyObserverValue1';
        dummyObserver3.value = 'dummyObserverValue3';
      });

      it('should build Observer Value Object out of observerKeysToUpdate and Value of Observer', () => {
        subscriptionContainer.observerKeysToUpdate.push('observer1');
        subscriptionContainer.observerKeysToUpdate.push('observer2');
        subscriptionContainer.observerKeysToUpdate.push('observer3');

        const props = runtime.getObjectBasedProps(subscriptionContainer);

        expect(props).toStrictEqual({
          observer1: 'dummyObserverValue1',
          observer2: undefined,
          observer3: 'dummyObserverValue3',
        });
        expect(subscriptionContainer.observerKeysToUpdate).toStrictEqual([]);
      });
    });

    describe('handleProxyBasedSubscription function tests', () => {
      let subscriptionContainer: SubscriptionContainer;
      const dummyFunction = () => {
        /* empty function */
      };
      let dummyJob: RuntimeJob;

      beforeEach(() => {
        subscriptionContainer = dummyAgile.subController.subscribeWithSubsObject(
          dummyFunction,
          { observer1: dummyObserver1 }
        ).subscriptionContainer;
        dummyObserver1.value = {
          key: 'dummyObserverValue1',
          data: { name: 'jeff' },
        };
        dummyObserver1.previousValue = {
          key: 'dummyObserverValue1',
          data: { name: 'jeff' },
        };
        subscriptionContainer.proxyBased = true;
        subscriptionContainer.proxyKeyMap = {
          [dummyObserver1._key || 'unknown']: { paths: [['data', 'name']] },
        };

        dummyJob = new RuntimeJob(dummyObserver1, { key: 'dummyObjectJob1' });

        jest.spyOn(Utils, 'notEqual');

        // Because not equals is called once during the creation of the subscriptionContainer
        jest.clearAllMocks();
      });

      it("should return true if subscriptionContainer isn't proxy based", () => {
        subscriptionContainer.proxyBased = false;

        const response = runtime.handleProxyBasedSubscription(
          subscriptionContainer,
          dummyJob
        );

        expect(response).toBeTruthy();
        expect(Utils.notEqual).not.toHaveBeenCalled();
      });

      it('should return true if observer the job represents has no key', () => {
        dummyJob.observer._key = undefined;

        const response = runtime.handleProxyBasedSubscription(
          subscriptionContainer,
          dummyJob
        );

        expect(response).toBeTruthy();
        expect(Utils.notEqual).not.toHaveBeenCalled();
      });

      it("should return true if the observer key isn't represented in the proxyKeyMap", () => {
        subscriptionContainer.proxyKeyMap = {
          unknownKey: { paths: [['a', 'b']] },
        };

        const response = runtime.handleProxyBasedSubscription(
          subscriptionContainer,
          dummyJob
        );

        expect(response).toBeTruthy();
        expect(Utils.notEqual).not.toHaveBeenCalled();
      });

      it('should return true if used property has changed', () => {
        dummyObserver1.value = {
          key: 'dummyObserverValue1',
          data: { name: 'hans' },
        };

        const response = runtime.handleProxyBasedSubscription(
          subscriptionContainer,
          dummyJob
        );

        expect(response).toBeTruthy();
        expect(Utils.notEqual).toHaveBeenCalledWith(
          dummyObserver1.value.data.name,
          dummyObserver1.previousValue.data.name
        );
      });

      it("should return false if used property hasn't changed", () => {
        const response = runtime.handleProxyBasedSubscription(
          subscriptionContainer,
          dummyJob
        );

        expect(response).toBeFalsy();
        expect(Utils.notEqual).toHaveBeenCalledWith(
          dummyObserver1.value.data.name,
          dummyObserver1.previousValue.data.name
        );
      });

      it('should return true if used property has changed in the deepness', () => {
        dummyObserver1.value = {
          key: 'dummyObserverValue1',
        };
        dummyObserver1.previousValue = {
          key: 'dummyObserverValue1',
          data: { name: undefined },
        };

        const response = runtime.handleProxyBasedSubscription(
          subscriptionContainer,
          dummyJob
        );

        expect(response).toBeTruthy();
        expect(Utils.notEqual).toHaveBeenCalledWith(undefined, undefined);
      });
    });
  });
});
