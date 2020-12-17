import {
  Agile,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
  Job,
  Observer,
  Runtime,
  SubscriptionContainer,
} from "../../../src";
import testIntegration from "../../helper/test.integration";

describe("Runtime Tests", () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });

    console.warn = jest.fn();
  });

  it("should create Runtime", () => {
    const runtime = new Runtime(dummyAgile);

    expect(runtime.currentJob).toBeNull();
    expect(runtime.jobQueue).toStrictEqual([]);
    expect(runtime.notReadyJobsToRerender.size).toBe(0);
    expect(runtime.jobsToRerender).toStrictEqual([]);
  });

  describe("Runtime Function Tests", () => {
    let runtime: Runtime;
    let dummyObserver1: Observer;
    let dummyObserver2: Observer;
    let dummyObserver3: Observer;

    beforeEach(() => {
      runtime = new Runtime(dummyAgile);
      dummyObserver1 = new Observer(dummyAgile, { key: "dummyObserver1" });
      dummyObserver2 = new Observer(dummyAgile, { key: "dummyObserver2" });
      dummyObserver3 = new Observer(dummyAgile, { key: "dummyObserver3" });
    });

    describe("ingest function tests", () => {
      let dummyJob: Job;

      beforeEach(() => {
        dummyJob = new Job(dummyObserver1);

        runtime.perform = jest.fn();
        runtime.jobQueue.shift = jest.fn(() => dummyJob);
      });

      it("should create Job and perform it (default config)", () => {
        runtime.ingest(dummyObserver1, { key: "coolJob" });

        expect(runtime.jobQueue.length).toBe(1);
        expect(runtime.jobQueue[0].key).toBe("coolJob");
        expect(runtime.jobQueue.shift).toHaveBeenCalled();
        expect(runtime.perform).toHaveBeenCalledWith(dummyJob); // Dummy Job because of mocking jobQueue.shift
      });

      it("should create Job and shouldn't perform it (config.perform = false)", () => {
        runtime.ingest(dummyObserver1, { perform: false, key: "coolJob" });

        expect(runtime.jobQueue.length).toBe(1);
        expect(runtime.jobQueue[0].key).toBe("coolJob");
        expect(runtime.jobQueue.shift).not.toHaveBeenCalled();
        expect(runtime.perform).not.toHaveBeenCalled();
      });
    });

    describe("perform function tests", () => {
      let dummyJob1: Job;
      let dummyJob2: Job;
      let dummyJob3: Job;

      beforeEach(() => {
        dummyJob1 = new Job(dummyObserver1, { key: "dummyJob1" });
        dummyJob2 = new Job(dummyObserver2, { key: "dummyJob2" });
        dummyJob3 = new Job(dummyObserver1, { key: "dummyJob3" });
        dummyJob1.rerender = true;
        dummyJob2.rerender = true;
        dummyJob3.rerender = false;

        runtime.updateSubscribers = jest.fn();
        jest.spyOn(dummyObserver1, "perform");
        jest.spyOn(dummyObserver2, "perform");
      });

      it("should perform passed Job and all that are left in jobsQueue and it should call updateSubscribers", () => {
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
        expect(runtime.jobsToRerender.indexOf(dummyJob1)).not.toBe(-1);
        expect(runtime.jobsToRerender.indexOf(dummyJob2)).not.toBe(-1);
        expect(runtime.jobsToRerender.indexOf(dummyJob3)).toBe(-1);

        // Sleep 5ms because updateSubscribers get called in timeout
        return new Promise((resolve) => setTimeout(resolve, 5)).then(() => {
          expect(runtime.updateSubscribers).toHaveBeenCalled();
        });
      });

      it("should perform passed Job and shouldn't call updateSubscribes", () => {
        dummyJob1.rerender = false;
        runtime.perform(dummyJob1);

        expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob1);
        expect(dummyJob1.performed).toBeTruthy();

        expect(runtime.jobQueue.length).toBe(0);
        expect(runtime.jobsToRerender.length).toBe(0);

        // Sleep 5ms because updateSubscribers get called in timeout
        return new Promise((resolve) => setTimeout(resolve, 5)).then(() => {
          expect(runtime.updateSubscribers).not.toHaveBeenCalled();
        });
      });
    });

    describe("updateSubscribers function tests", () => {
      let dummyObserver4: Observer;
      let dummyJob1: Job;
      let dummyJob2: Job;
      let dummyJob3: Job;
      let dummyJob4: Job;
      let dummyCallbackSubscriptionContainer1: CallbackSubscriptionContainer;
      let dummyCallbackFunction1 = () => {};
      let dummyCallbackSubscriptionContainer2: CallbackSubscriptionContainer;
      let dummyCallbackFunction2 = () => {};
      let dummyComponentSubscriptionContainer1: ComponentSubscriptionContainer;
      let dummyComponent1 = {
        my: "cool component",
      };
      let dummyComponentSubscriptionContainer2: ComponentSubscriptionContainer;
      let dummyComponent2 = {
        my: "second cool component",
      };

      beforeEach(() => {
        dummyAgile.integrate(testIntegration);
        dummyObserver4 = new Observer(dummyAgile, { key: "dummyObserver4" });

        dummyObserver1.value = "dummyObserverValue1";
        dummyObserver2.value = "dummyObserverValue2";
        dummyObserver3.value = "dummyObserverValue3";
        dummyObserver4.value = "dummyObserverValue4";

        // Ready Callback Subscription
        dummyCallbackSubscriptionContainer1 = dummyAgile.subController.subscribeWithSubsArray(
          dummyCallbackFunction1,
          [dummyObserver1, dummyObserver2]
        ) as CallbackSubscriptionContainer;
        dummyCallbackSubscriptionContainer1.callback = jest.fn();
        dummyJob1 = new Job(dummyObserver1, { key: "dummyJob1" }); // Job with ready CallbackSubscription

        // Not Ready Callback Subscription
        dummyCallbackSubscriptionContainer2 = dummyAgile.subController.subscribeWithSubsArray(
          dummyCallbackFunction2,
          [dummyObserver2]
        ) as CallbackSubscriptionContainer;
        dummyCallbackSubscriptionContainer2.callback = jest.fn();
        dummyCallbackSubscriptionContainer2.ready = false;
        dummyJob2 = new Job(dummyObserver2, { key: "dummyJob2" }); // Job with not ready and ready Callback Subscription

        // Ready Component Subscription
        dummyComponentSubscriptionContainer1 = dummyAgile.subController.subscribeWithSubsObject(
          dummyComponent1,
          {
            observer3: dummyObserver3,
            observer4: dummyObserver4,
          }
        ).subscriptionContainer as ComponentSubscriptionContainer;
        dummyJob3 = new Job(dummyObserver3, { key: "dummyJob3" }); // Job with ready Component Subscription

        // Not Ready Component Subscription
        dummyComponentSubscriptionContainer2 = dummyAgile.subController.subscribeWithSubsObject(
          dummyComponent2,
          {
            observer4: dummyObserver4,
          }
        ).subscriptionContainer as ComponentSubscriptionContainer;
        dummyComponentSubscriptionContainer2.ready = false;
        dummyJob4 = new Job(dummyObserver4, { key: "dummyJob4" }); // Job with not ready and ready Component Subscription

        jest.spyOn(dummyAgile.integrations, "update");
        jest.spyOn(runtime, "handleObjectBasedSubscription");
      });

      it("shouldn't update any subscribers if agile has no integration", () => {
        dummyAgile.hasIntegration = jest.fn(() => false);
        runtime.jobsToRerender.push(dummyJob1);
        runtime.jobsToRerender.push(dummyJob2);

        runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);
        expect(dummyAgile.integrations.update).not.toHaveBeenCalled();
        expect(
          dummyCallbackSubscriptionContainer1.callback
        ).not.toHaveBeenCalled();
        expect(
          dummyCallbackSubscriptionContainer2.callback
        ).not.toHaveBeenCalled();
      });

      it("should update ready component based subscription", () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.jobsToRerender.push(dummyJob3);

        runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);

        expect(dummyAgile.integrations.update).toHaveBeenCalledWith(
          dummyComponent1,
          {
            observer3: "dummyObserverValue3",
          }
        );
        expect(runtime.handleObjectBasedSubscription).toHaveBeenCalledWith(
          dummyComponentSubscriptionContainer1,
          dummyJob3
        );
        expect(dummyJob3.subscriptionContainersToUpdate.size).toBe(0);
        expect(dummyObserver3.subs.size).toBe(1);
      });

      it("should update ready callback based subscription", () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.jobsToRerender.push(dummyJob1);

        runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);

        expect(dummyCallbackSubscriptionContainer1.callback).toHaveBeenCalled();
        expect(dummyJob1.subscriptionContainersToUpdate.size).toBe(0);
        expect(dummyObserver1.subs.size).toBe(1);
      });

      it("shouldn't update not ready subscriptions", () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.jobsToRerender.push(dummyJob2);
        runtime.jobsToRerender.push(dummyJob4);

        runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(2);
        expect(runtime.notReadyJobsToRerender.has(dummyJob2)).toBeTruthy();
        expect(runtime.notReadyJobsToRerender.has(dummyJob4)).toBeTruthy();

        expect(dummyJob2.subscriptionContainersToUpdate.size).toBe(1);
        expect(
          dummyJob2.subscriptionContainersToUpdate.has(
            dummyCallbackSubscriptionContainer2
          )
        ).toBeTruthy();
        expect(dummyJob4.subscriptionContainersToUpdate.size).toBe(1);
        expect(
          dummyJob4.subscriptionContainersToUpdate.has(
            dummyComponentSubscriptionContainer2
          )
        ).toBeTruthy();

        expect(dummyCallbackSubscriptionContainer1.callback).toHaveBeenCalled();
        expect(
          dummyCallbackSubscriptionContainer2.callback
        ).not.toHaveBeenCalled();

        expect(dummyAgile.integrations.update).toHaveBeenCalledWith(
          dummyComponent1,
          {
            observer4: "dummyObserverValue4",
          }
        );
        expect(dummyAgile.integrations.update).not.toHaveBeenCalledWith(
          dummyComponent2,
          {
            observer4: "dummyObserverValue4",
          }
        );

        expect(dummyObserver2.subs.size).toBe(2);
        expect(dummyObserver4.subs.size).toBe(2);

        expect(runtime.handleObjectBasedSubscription).toHaveBeenCalledWith(
          dummyComponentSubscriptionContainer1,
          dummyJob4
        );
        expect(runtime.handleObjectBasedSubscription).not.toHaveBeenCalledWith(
          dummyComponentSubscriptionContainer2,
          dummyJob4
        );

        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: SubscriptionContainer/Component isn't ready to rerender!",
          dummyCallbackSubscriptionContainer2
        );
        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: SubscriptionContainer/Component isn't ready to rerender!",
          dummyComponentSubscriptionContainer2
        );
      });

      it("should try to update notReadyJobsToUpdate", () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.notReadyJobsToRerender.add(dummyJob1);

        runtime.updateSubscribers();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);

        expect(dummyCallbackSubscriptionContainer1.callback).toHaveBeenCalled();
        expect(dummyJob1.subscriptionContainersToUpdate.size).toBe(0);
        expect(dummyObserver1.subs.size).toBe(1);
      });
    });

    describe("handleObjectBasedSubscription function tests", () => {
      let arraySubscriptionContainer: SubscriptionContainer;
      let dummyComponent = {
        my: "cool component",
      };
      let objectSubscriptionContainer: SubscriptionContainer;
      let dummyComponent2 = {
        my: "second cool component",
      };
      let arrayJob: Job;
      let objectJob1: Job;
      let objectJob2: Job;

      beforeEach(() => {
        arraySubscriptionContainer = dummyAgile.subController.subscribeWithSubsArray(
          dummyComponent,
          [dummyObserver1, dummyObserver2, dummyObserver3]
        );
        arrayJob = new Job(dummyObserver1, { key: "dummyArrayJob" });
        objectSubscriptionContainer = dummyAgile.subController.subscribeWithSubsObject(
          dummyComponent2,
          {
            observer1: dummyObserver1,
            observer2: dummyObserver2,
            observer3: dummyObserver3,
          }
        ).subscriptionContainer;
        objectJob1 = new Job(dummyObserver1, { key: "dummyObjectJob1" });
        objectJob2 = new Job(dummyObserver3, { key: "dummyObjectJob2" });
      });

      it("should ignore not object based SubscriptionContainer", () => {
        runtime.handleObjectBasedSubscription(
          arraySubscriptionContainer,
          arrayJob
        );

        expect(arraySubscriptionContainer.observerKeysToUpdate).toStrictEqual(
          []
        );
      });

      it("should add Job Observer to changedObjectKeys in SubscriptionContainer", () => {
        runtime.handleObjectBasedSubscription(
          objectSubscriptionContainer,
          objectJob1
        );
        runtime.handleObjectBasedSubscription(
          objectSubscriptionContainer,
          objectJob2
        );

        expect(objectSubscriptionContainer.observerKeysToUpdate).toStrictEqual([
          "observer1",
          "observer3",
        ]);
      });
    });

    describe("getObjectBasedProps function tests", () => {
      let subscriptionContainer: SubscriptionContainer;
      let dummyFunction = () => {};

      beforeEach(() => {
        subscriptionContainer = dummyAgile.subController.subscribeWithSubsObject(
          dummyFunction,
          {
            observer1: dummyObserver1,
            observer2: dummyObserver2,
            observer3: dummyObserver3,
          }
        ).subscriptionContainer;
        dummyObserver1.value = "dummyObserverValue1";
        dummyObserver3.value = "dummyObserverValue3";
      });

      it("should build Observer Value object out of observerKeysToUpdate and reset it after that", () => {
        subscriptionContainer.observerKeysToUpdate.push("observer1");
        subscriptionContainer.observerKeysToUpdate.push("observer2");
        subscriptionContainer.observerKeysToUpdate.push("observer3");

        const props = runtime.getObjectBasedProps(subscriptionContainer);

        expect(props).toStrictEqual({
          observer1: "dummyObserverValue1",
          observer3: "dummyObserverValue3",
        });
        expect(subscriptionContainer.observerKeysToUpdate).toStrictEqual([]);
      });
    });
  });
});
