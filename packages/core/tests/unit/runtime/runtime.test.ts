import {
  Agile,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
  RuntimeJob,
  Observer,
  Runtime,
  SubscriptionContainer,
} from '../../../src';
import testIntegration from '../../helper/test.integration';

describe('Runtime Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
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

      it("should perform passed Job and all in jobQueue remaining and shouldn't call updateSubscribes if no job needs to rerender", async () => {
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
          [dummyObserver1, dummyObserver2],
        ) as CallbackSubscriptionContainer;
        rCallbackSubContainer.callback = jest.fn();

        // Create Not Ready Callback Subscription
        nrCallbackSubContainer = dummyAgile.subController.subscribeWithSubsArray(
          nrCallbackSubContainerCallbackFunction,
          [dummyObserver2],
        ) as CallbackSubscriptionContainer;
        nrCallbackSubContainer.callback = jest.fn();
        nrCallbackSubContainer.ready = false;

        // Create Ready Component Subscription
        rComponentSubContainer = dummyAgile.subController.subscribeWithSubsObject(
          rComponentSubContainerComponent,
          {
            observer3: dummyObserver3,
            observer4: dummyObserver4,
          },
        ).subscriptionContainer as ComponentSubscriptionContainer;

        // Create Not Ready Component Subscription
        nrComponentSubContainer = dummyAgile.subController.subscribeWithSubsObject(
          nrComponentSubContainerComponent,
          {
            observer4: dummyObserver4,
          },
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

      it('should update ready component based Subscription', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.jobsToRerender.push(rComponentSubJob);

        runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);

        expect(dummyAgile.integrations.update).toHaveBeenCalledTimes(1);
        expect(dummyAgile.integrations.update).toHaveBeenCalledWith(
          rComponentSubContainerComponent,
          {
            observer3: 'dummyObserverValue3',
          },
        );
        expect(runtime.handleObjectBasedSubscription).toHaveBeenCalledWith(
          rComponentSubContainer,
          rComponentSubJob,
        );
        expect(rComponentSubJob.subscriptionContainersToUpdate.size).toBe(0);
        expect(dummyObserver3.subs.size).toBe(1);
      });

      it('should update ready callback based Subscription', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.jobsToRerender.push(rCallbackSubJob);

        runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);

        expect(rCallbackSubContainer.callback).toHaveBeenCalledTimes(1);
        expect(rCallbackSubJob.subscriptionContainersToUpdate.size).toBe(0);
        expect(dummyObserver1.subs.size).toBe(1);
      });

      it("shouldn't update not ready Subscriptions", () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.jobsToRerender.push(nrArCallbackSubJob);
        runtime.jobsToRerender.push(nrArComponentSubJob);

        runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(2);
        expect(
          runtime.notReadyJobsToRerender.has(nrArCallbackSubJob),
        ).toBeTruthy();
        expect(
          runtime.notReadyJobsToRerender.has(nrArComponentSubJob),
        ).toBeTruthy();

        expect(nrArCallbackSubJob.subscriptionContainersToUpdate.size).toBe(1);
        expect(
          nrArCallbackSubJob.subscriptionContainersToUpdate.has(
            nrCallbackSubContainer,
          ),
        ).toBeTruthy();
        expect(nrArComponentSubJob.subscriptionContainersToUpdate.size).toBe(1);
        expect(
          nrArComponentSubJob.subscriptionContainersToUpdate.has(
            nrComponentSubContainer,
          ),
        ).toBeTruthy();

        expect(rCallbackSubContainer.callback).toHaveBeenCalledTimes(1);
        expect(nrCallbackSubContainer.callback).not.toHaveBeenCalled();

        expect(dummyAgile.integrations.update).toHaveBeenCalledTimes(1);
        expect(dummyAgile.integrations.update).toHaveBeenCalledWith(
          rComponentSubContainerComponent,
          {
            observer4: 'dummyObserverValue4',
          },
        );
        expect(dummyAgile.integrations.update).not.toHaveBeenCalledWith(
          nrComponentSubContainerComponent,
          {
            observer4: 'dummyObserverValue4',
          },
        );

        expect(dummyObserver2.subs.size).toBe(2);
        expect(dummyObserver4.subs.size).toBe(2);

        expect(runtime.handleObjectBasedSubscription).toHaveBeenCalledWith(
          rComponentSubContainer,
          nrArComponentSubJob,
        );
        expect(runtime.handleObjectBasedSubscription).not.toHaveBeenCalledWith(
          nrComponentSubContainer,
          nrArComponentSubJob,
        );

        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: SubscriptionContainer/Component isn't ready to rerender!",
          nrCallbackSubContainer,
        );
        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: SubscriptionContainer/Component isn't ready to rerender!",
          nrComponentSubContainer,
        );
      });

      it('should update in the past not ready Subscriptions in notReadyJobsToUpdate', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.notReadyJobsToRerender.add(rCallbackSubJob);

        runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);

        expect(rCallbackSubContainer.callback).toHaveBeenCalled();
        expect(rCallbackSubJob.subscriptionContainersToUpdate.size).toBe(0);
        expect(dummyObserver1.subs.size).toBe(1);
      });
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
          [dummyObserver1, dummyObserver2, dummyObserver3],
        );
        arrayJob = new RuntimeJob(dummyObserver1, { key: 'dummyArrayJob' });

        objectSubscriptionContainer = dummyAgile.subController.subscribeWithSubsObject(
          dummyComponent2,
          {
            observer1: dummyObserver1,
            observer2: dummyObserver2,
            observer3: dummyObserver3,
          },
        ).subscriptionContainer;
        objectJob1 = new RuntimeJob(dummyObserver1, { key: 'dummyObjectJob1' });
        objectJob2 = new RuntimeJob(dummyObserver3, { key: 'dummyObjectJob2' });
      });

      it('should ignore not object based SubscriptionContainer', () => {
        runtime.handleObjectBasedSubscription(
          arraySubscriptionContainer,
          arrayJob,
        );

        expect(arraySubscriptionContainer.observerKeysToUpdate).toStrictEqual(
          [],
        );
      });

      it('should add Job Observer to changedObjectKeys in SubscriptionContainer', () => {
        runtime.handleObjectBasedSubscription(
          objectSubscriptionContainer,
          objectJob1,
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
          },
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
          observer3: 'dummyObserverValue3',
        });
        expect(subscriptionContainer.observerKeysToUpdate).toStrictEqual([]);
      });
    });
  });
});
