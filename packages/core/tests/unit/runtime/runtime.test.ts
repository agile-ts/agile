import {
  Agile,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
  RuntimeJob,
  Observer,
  Runtime,
  SubscriptionContainer,
} from '../../../src';
import * as Utils from '@agile-ts/utils';
import { LogMock } from '../../helper/logMock';

describe('Runtime Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    LogMock.mockLogs();

    dummyAgile = new Agile({ localStorage: false });
  });

  it('should create Runtime', () => {
    const runtime = new Runtime(dummyAgile);

    expect(runtime.agileInstance()).toBe(dummyAgile);
    expect(runtime.currentJob).toBeNull();
    expect(runtime.jobQueue).toStrictEqual([]);
    expect(runtime.jobsToRerender).toStrictEqual([]);
    expect(Array.from(runtime.notReadyJobsToRerender)).toStrictEqual([]);
    expect(runtime.isPerformingJobs).toBeFalsy();
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

      it("should perform specified Job immediately if jobQueue isn't being processed (default config)", () => {
        runtime.isPerformingJobs = false;

        runtime.ingest(dummyJob);

        expect(runtime.jobQueue).toStrictEqual([]);
        expect(runtime.perform).toHaveBeenCalledWith(dummyJob);
      });

      it("shouldn't perform specified Job immediately if jobQueue is being processed (default config)", () => {
        runtime.isPerformingJobs = true;

        runtime.ingest(dummyJob);

        expect(runtime.jobQueue).toStrictEqual([dummyJob]);
        expect(runtime.perform).not.toHaveBeenCalled();
      });

      it('should perform specified Job immediately (config.perform = true)', () => {
        runtime.isPerformingJobs = true;
        runtime.ingest(dummyJob, { perform: true });

        expect(runtime.jobQueue).toStrictEqual([]);
        expect(runtime.perform).toHaveBeenCalledWith(dummyJob);
      });

      it("shouldn't perform specified Job immediately (config.perform = false)", () => {
        runtime.isPerformingJobs = false;
        runtime.ingest(dummyJob, { perform: false });

        expect(runtime.jobQueue).toStrictEqual([dummyJob]);
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

      it(
        "should perform specified Job and all remaining Jobs in the 'jobQueue' " +
          "and call 'updateSubscribers' if at least one performed Job needs to rerender",
        async () => {
          runtime.jobQueue.push(dummyJob2);
          runtime.jobQueue.push(dummyJob3);

          runtime.perform(dummyJob1);

          expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob1);
          expect(dummyJob1.performed).toBeTruthy();
          expect(dummyObserver2.perform).toHaveBeenCalledWith(dummyJob2);
          expect(dummyJob2.performed).toBeTruthy();
          expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob3);
          expect(dummyJob3.performed).toBeTruthy();

          expect(runtime.isPerformingJobs).toBeFalsy(); // because Jobs were performed
          expect(runtime.jobQueue).toStrictEqual([]);
          expect(runtime.jobsToRerender).toStrictEqual([dummyJob1, dummyJob2]);

          // Sleep 5ms because updateSubscribers is called in a timeout
          await new Promise((resolve) => setTimeout(resolve, 5));

          expect(runtime.updateSubscribers).toHaveBeenCalledTimes(1);
        }
      );

      it('should perform specified Job and ingest its dependents into the runtime', async () => {
        dummyJob1.observer.dependents.add(dummyObserver2);
        dummyJob1.observer.dependents.add(dummyObserver1);

        runtime.perform(dummyJob1);

        expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob1);
        expect(dummyJob1.performed).toBeTruthy();

        expect(dummyObserver1.ingest).toHaveBeenCalledTimes(1);
        expect(dummyObserver1.ingest).toHaveBeenCalledWith({
          perform: false,
        });
        expect(dummyObserver2.ingest).toHaveBeenCalledTimes(1);
        expect(dummyObserver2.ingest).toHaveBeenCalledWith({
          perform: false,
        });
      });

      it(
        "should perform specified Job and all remaining Jobs in the 'jobQueue' " +
          "and shouldn't call 'updateSubscribes' if no performed Job needs to rerender",
        async () => {
          dummyJob1.rerender = false;
          runtime.jobQueue.push(dummyJob3);

          runtime.perform(dummyJob1);

          expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob1);
          expect(dummyJob1.performed).toBeTruthy();
          expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob3);
          expect(dummyJob3.performed).toBeTruthy();

          expect(runtime.isPerformingJobs).toBeFalsy(); // because Jobs were performed
          expect(runtime.jobQueue).toStrictEqual([]);
          expect(runtime.jobsToRerender).toStrictEqual([]);

          // Sleep 5ms because updateSubscribers is called in a timeout
          await new Promise((resolve) => setTimeout(resolve, 5));

          expect(runtime.updateSubscribers).not.toHaveBeenCalled();
        }
      );
    });

    describe('updateSubscribers function tests', () => {
      let dummyJob1: RuntimeJob;
      let dummyJob2: RuntimeJob;
      let dummyJob3: RuntimeJob;
      const dummySubscriptionContainer1IntegrationInstance = () => {
        /* empty function */
      };
      let dummySubscriptionContainer1: SubscriptionContainer;
      const dummySubscriptionContainer2IntegrationInstance = {
        my: 'cool component',
      };
      let dummySubscriptionContainer2: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer1 = dummyAgile.subController.subscribe(
          dummySubscriptionContainer1IntegrationInstance,
          [dummyObserver1]
        );
        dummySubscriptionContainer2 = dummyAgile.subController.subscribe(
          dummySubscriptionContainer2IntegrationInstance,
          [dummyObserver2, dummyObserver3]
        );

        dummyJob1 = new RuntimeJob(dummyObserver1);
        dummyJob2 = new RuntimeJob(dummyObserver2);
        dummyJob3 = new RuntimeJob(dummyObserver3);

        runtime.updateSubscriptionContainer = jest.fn();
        jest.spyOn(runtime, 'extractToUpdateSubscriptionContainer');
      });

      it('should return false if Agile has no registered Integration', () => {
        dummyAgile.hasIntegration = jest.fn(() => false);
        runtime.jobsToRerender = [dummyJob1, dummyJob2];

        const response = runtime.updateSubscribers();

        expect(response).toBeFalsy();

        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(Array.from(runtime.notReadyJobsToRerender)).toStrictEqual([]);
        expect(
          runtime.extractToUpdateSubscriptionContainer
        ).not.toHaveBeenCalled();
        expect(runtime.updateSubscriptionContainer).not.toHaveBeenCalled();
      });

      it('should return false if jobsToRerender and notReadyJobsToRerender queue are both empty', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.jobsToRerender = [];
        runtime.notReadyJobsToRerender = new Set();

        const response = runtime.updateSubscribers();

        expect(response).toBeFalsy();

        expect(response).toBeFalsy();
        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(Array.from(runtime.notReadyJobsToRerender)).toStrictEqual([]);
        expect(
          runtime.extractToUpdateSubscriptionContainer
        ).not.toHaveBeenCalled();
        expect(runtime.updateSubscriptionContainer).not.toHaveBeenCalled();
      });

      it('should return false if no Subscription Container of the Jobs to rerender queue needs to update', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        jest
          .spyOn(runtime, 'extractToUpdateSubscriptionContainer')
          .mockReturnValueOnce([]);
        runtime.jobsToRerender = [dummyJob1, dummyJob2];
        runtime.notReadyJobsToRerender = new Set([dummyJob3]);

        const response = runtime.updateSubscribers();

        expect(response).toBeFalsy();
        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(Array.from(runtime.notReadyJobsToRerender)).toStrictEqual([]);
        expect(
          runtime.extractToUpdateSubscriptionContainer
        ).toHaveBeenCalledWith([dummyJob1, dummyJob2, dummyJob3]);
        expect(runtime.updateSubscriptionContainer).not.toHaveBeenCalled();
      });

      it('should return true if at least one Subscription Container of the Jobs to rerender queue needs to update', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        jest
          .spyOn(runtime, 'extractToUpdateSubscriptionContainer')
          .mockReturnValueOnce([
            dummySubscriptionContainer1,
            dummySubscriptionContainer2,
          ]);
        runtime.jobsToRerender = [dummyJob1, dummyJob2];
        runtime.notReadyJobsToRerender = new Set([dummyJob3]);

        const response = runtime.updateSubscribers();

        expect(response).toBeTruthy();
        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(Array.from(runtime.notReadyJobsToRerender)).toStrictEqual([]);
        expect(
          runtime.extractToUpdateSubscriptionContainer
        ).toHaveBeenCalledWith([dummyJob1, dummyJob2, dummyJob3]);
        expect(runtime.updateSubscriptionContainer).toHaveBeenCalledWith([
          dummySubscriptionContainer1,
          dummySubscriptionContainer2,
        ]);
      });
    });

    describe('extractToUpdateSubscriptionContainer function tests', () => {
      let dummyJob1: RuntimeJob;
      let dummyJob2: RuntimeJob;
      const dummySubscriptionContainer1IntegrationInstance = () => {
        /* empty function */
      };
      let dummySubscriptionContainer1: SubscriptionContainer;
      const dummySubscriptionContainer2IntegrationInstance = {
        my: 'cool component',
      };
      let dummySubscriptionContainer2: SubscriptionContainer;

      beforeEach(() => {
        dummySubscriptionContainer1 = dummyAgile.subController.subscribe(
          dummySubscriptionContainer1IntegrationInstance,
          [dummyObserver1]
        );
        dummySubscriptionContainer2 = dummyAgile.subController.subscribe(
          dummySubscriptionContainer2IntegrationInstance,
          [dummyObserver2]
        );

        dummyJob1 = new RuntimeJob(dummyObserver1);
        dummyJob2 = new RuntimeJob(dummyObserver2);

        jest.spyOn(runtime, 'handleSelectors');
      });

      it(
        "shouldn't extract not ready Subscription Container from the specified Jobs, " +
          "should add it to the 'notReadyJobsToRerender' queue and print a warning",
        () => {
          jest
            .spyOn(runtime, 'handleSelectors')
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);
          dummySubscriptionContainer1.ready = true;
          dummySubscriptionContainer2.ready = false;

          const response = runtime.extractToUpdateSubscriptionContainer([
            dummyJob1,
            dummyJob2,
          ]);

          expect(response).toStrictEqual([dummySubscriptionContainer1]);

          // Called with Job that ran through
          expect(runtime.handleSelectors).toHaveBeenCalledTimes(1);
          expect(runtime.handleSelectors).toHaveBeenCalledWith(
            dummySubscriptionContainer1,
            dummyJob1
          );

          expect(Array.from(runtime.notReadyJobsToRerender)).toStrictEqual([
            dummyJob2,
          ]);

          // Job that ran through
          expect(
            Array.from(dummyJob1.subscriptionContainersToUpdate)
          ).toStrictEqual([]);
          expect(dummyJob1.triedToUpdateCount).toBe(0);
          expect(
            Array.from(dummySubscriptionContainer1.updatedSubscribers)
          ).toStrictEqual([dummyObserver1]);

          // Job that didn't ran through
          expect(
            Array.from(dummyJob2.subscriptionContainersToUpdate)
          ).toStrictEqual([dummySubscriptionContainer2]);
          expect(dummyJob2.triedToUpdateCount).toBe(1);
          expect(
            Array.from(dummySubscriptionContainer2.updatedSubscribers)
          ).toStrictEqual([]);

          // Called with Job that didn't ran through
          expect(console.warn).toHaveBeenCalledTimes(1);
          LogMock.hasLoggedCode(
            '16:02:00',
            [dummySubscriptionContainer2.key],
            dummySubscriptionContainer2
          );
        }
      );

      it(
        "shouldn't extract not ready Subscription Container from the specified Jobs, " +
          "should remove the Job when it exceeded the max 'maxTriesToUpdate' " +
          'and print a warning',
        () => {
          jest
            .spyOn(runtime, 'handleSelectors')
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);
          dummySubscriptionContainer1.ready = true;
          dummySubscriptionContainer2.ready = false;
          const numberOfTries = (dummyJob2.config.maxTriesToUpdate ?? 0) + 1;
          dummyJob2.triedToUpdateCount = numberOfTries;

          const response = runtime.extractToUpdateSubscriptionContainer([
            dummyJob1,
            dummyJob2,
          ]);

          expect(response).toStrictEqual([dummySubscriptionContainer1]);

          // Called with Job that ran through
          expect(runtime.handleSelectors).toHaveBeenCalledTimes(1);
          expect(runtime.handleSelectors).toHaveBeenCalledWith(
            dummySubscriptionContainer1,
            dummyJob1
          );

          expect(Array.from(runtime.notReadyJobsToRerender)).toStrictEqual([]); // Because exceeded Job was removed

          // Job that ran through
          expect(
            Array.from(dummyJob1.subscriptionContainersToUpdate)
          ).toStrictEqual([]);
          expect(dummyJob1.triedToUpdateCount).toBe(0);
          expect(
            Array.from(dummySubscriptionContainer1.updatedSubscribers)
          ).toStrictEqual([dummyObserver1]);

          // Job that didn't ran through
          expect(
            Array.from(dummyJob2.subscriptionContainersToUpdate)
          ).toStrictEqual([dummySubscriptionContainer2]);
          expect(dummyJob2.triedToUpdateCount).toBe(numberOfTries);
          expect(
            Array.from(dummySubscriptionContainer2.updatedSubscribers)
          ).toStrictEqual([]);

          // Called with Job that didn't ran through
          expect(console.warn).toHaveBeenCalledTimes(1);
          LogMock.hasLoggedCode(
            '16:02:01',
            [dummyJob2.config.maxTriesToUpdate],
            dummySubscriptionContainer2
          );
        }
      );

      it("shouldn't extract Subscription Container if the selected property hasn't changed", () => {
        jest
          .spyOn(runtime, 'handleSelectors')
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true);
        dummySubscriptionContainer1.ready = true;
        dummySubscriptionContainer2.ready = true;

        const response = runtime.extractToUpdateSubscriptionContainer([
          dummyJob1,
          dummyJob2,
        ]);

        expect(response).toStrictEqual([dummySubscriptionContainer2]);

        expect(runtime.handleSelectors).toHaveBeenCalledTimes(2);
        expect(runtime.handleSelectors).toHaveBeenCalledWith(
          dummySubscriptionContainer1,
          dummyJob1
        );
        expect(runtime.handleSelectors).toHaveBeenCalledWith(
          dummySubscriptionContainer2,
          dummyJob2
        );

        // Since the Job is ready but the Observer value simply hasn't changed
        // -> no point in trying to update it again
        expect(Array.from(runtime.notReadyJobsToRerender)).toStrictEqual([]);

        // Job that didn't ran through
        expect(
          Array.from(dummyJob1.subscriptionContainersToUpdate)
        ).toStrictEqual([]);
        expect(dummyJob1.triedToUpdateCount).toBe(0);
        expect(
          Array.from(dummySubscriptionContainer1.updatedSubscribers)
        ).toStrictEqual([]);

        // Job that ran through
        expect(
          Array.from(dummyJob2.subscriptionContainersToUpdate)
        ).toStrictEqual([]);
        expect(dummyJob2.triedToUpdateCount).toBe(0);
        expect(
          Array.from(dummySubscriptionContainer2.updatedSubscribers)
        ).toStrictEqual([dummyObserver2]);

        expect(console.warn).toHaveBeenCalledTimes(0);
      });

      it('should extract ready and to update Subscription Containers', () => {
        jest
          .spyOn(runtime, 'handleSelectors')
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true);
        dummySubscriptionContainer1.ready = true;
        dummySubscriptionContainer2.ready = true;

        const response = runtime.extractToUpdateSubscriptionContainer([
          dummyJob1,
          dummyJob2,
        ]);

        expect(response).toStrictEqual([
          dummySubscriptionContainer1,
          dummySubscriptionContainer2,
        ]);

        expect(runtime.handleSelectors).toHaveBeenCalledTimes(2);
        expect(runtime.handleSelectors).toHaveBeenCalledWith(
          dummySubscriptionContainer1,
          dummyJob1
        );
        expect(runtime.handleSelectors).toHaveBeenCalledWith(
          dummySubscriptionContainer2,
          dummyJob2
        );

        expect(Array.from(runtime.notReadyJobsToRerender)).toStrictEqual([]);

        // Job that ran through
        expect(
          Array.from(dummyJob1.subscriptionContainersToUpdate)
        ).toStrictEqual([]);
        expect(dummyJob1.triedToUpdateCount).toBe(0);
        expect(
          Array.from(dummySubscriptionContainer1.updatedSubscribers)
        ).toStrictEqual([dummyObserver1]);

        // Job that ran through
        expect(
          Array.from(dummyJob2.subscriptionContainersToUpdate)
        ).toStrictEqual([]);
        expect(dummyJob2.triedToUpdateCount).toBe(0);
        expect(
          Array.from(dummySubscriptionContainer2.updatedSubscribers)
        ).toStrictEqual([dummyObserver2]);

        expect(console.warn).not.toHaveBeenCalled();
      });
    });

    describe('updateSubscriptionContainer function tests', () => {
      const dummyIntegration1 = { dummy: 'component' };
      let componentSubscriptionContainer1: ComponentSubscriptionContainer;
      const dummyIntegration2 = jest.fn();
      let callbackSubscriptionContainer2: CallbackSubscriptionContainer;
      const dummyIntegration3 = jest.fn();
      let callbackSubscriptionContainer3: CallbackSubscriptionContainer;

      beforeEach(() => {
        componentSubscriptionContainer1 = dummyAgile.subController.subscribe(
          dummyIntegration1,
          [dummyObserver1]
        ) as ComponentSubscriptionContainer;
        componentSubscriptionContainer1.updatedSubscribers = new Set([
          dummyObserver1,
        ]);
        callbackSubscriptionContainer2 = dummyAgile.subController.subscribe(
          dummyIntegration2,
          [dummyObserver2]
        ) as CallbackSubscriptionContainer;
        callbackSubscriptionContainer2.updatedSubscribers = new Set([
          dummyObserver2,
        ]);
        callbackSubscriptionContainer3 = dummyAgile.subController.subscribe(
          dummyIntegration3,
          [dummyObserver3]
        ) as CallbackSubscriptionContainer;
        callbackSubscriptionContainer3.updatedSubscribers = new Set([
          dummyObserver3,
        ]);

        dummyAgile.integrations.update = jest.fn();
      });

      it('should update the specified Subscription Container', () => {
        jest
          .spyOn(runtime, 'getUpdatedObserverValues')
          .mockReturnValueOnce('propsBasedOnUpdatedObservers' as any);

        runtime.updateSubscriptionContainer([
          componentSubscriptionContainer1,
          callbackSubscriptionContainer2,
          callbackSubscriptionContainer3,
        ]);

        // Component Subscription Container 1
        expect(dummyAgile.integrations.update).toHaveBeenCalledTimes(1);
        expect(dummyAgile.integrations.update).toHaveBeenCalledWith(
          dummyIntegration1,
          'propsBasedOnUpdatedObservers'
        );
        expect(
          Array.from(componentSubscriptionContainer1.updatedSubscribers)
        ).toStrictEqual([]);

        // Callback Subscription Container 2
        expect(callbackSubscriptionContainer2.callback).toHaveBeenCalledTimes(
          1
        );
        expect(
          Array.from(callbackSubscriptionContainer2.updatedSubscribers)
        ).toStrictEqual([]);

        // Callback Subscription Container 3
        expect(callbackSubscriptionContainer3.callback).toHaveBeenCalledTimes(
          1
        );
        expect(
          Array.from(callbackSubscriptionContainer2.updatedSubscribers)
        ).toStrictEqual([]);
      });
    });

    describe('getUpdatedObserverValues function tests', () => {
      let subscriptionContainer: SubscriptionContainer;
      const dummyFunction = () => {
        /* empty function */
      };

      beforeEach(() => {
        subscriptionContainer = dummyAgile.subController.subscribe(
          dummyFunction,
          [dummyObserver1, dummyObserver2, dummyObserver3]
        );
        dummyObserver1.value = 'dummyObserverValue1';
        dummyObserver3.value = 'dummyObserverValue3';

        dummyObserver1._key = 'dummyObserver1KeyInObserver';
        dummyObserver2._key = undefined;
        subscriptionContainer.subscriberKeysWeakMap.set(
          dummyObserver2,
          'dummyObserver2KeyInWeakMap'
        );
        dummyObserver3._key = 'dummyObserver3KeyInObserver';
        subscriptionContainer.subscriberKeysWeakMap.set(
          dummyObserver3,
          'dummyObserver3KeyInWeakMap'
        );
      });

      it('should map the values of the updated Observers into an object and return it', () => {
        subscriptionContainer.updatedSubscribers.add(dummyObserver1);
        subscriptionContainer.updatedSubscribers.add(dummyObserver2);
        subscriptionContainer.updatedSubscribers.add(dummyObserver3);

        const props = runtime.getUpdatedObserverValues(subscriptionContainer);

        expect(props).toStrictEqual({
          dummyObserver1KeyInObserver: 'dummyObserverValue1',
          dummyObserver2KeyInWeakMap: undefined,
          dummyObserver3KeyInWeakMap: 'dummyObserverValue3',
        });
        expect(
          Array.from(subscriptionContainer.updatedSubscribers)
        ).toStrictEqual([dummyObserver1, dummyObserver2, dummyObserver3]);
      });
    });

    describe('handleSelector function tests', () => {
      let objectSubscriptionContainer: SubscriptionContainer;
      const dummyFunction = () => {
        /* empty function */
      };
      let objectJob: RuntimeJob;

      let arraySubscriptionContainer: SubscriptionContainer;
      const dummyFunction2 = () => {
        /* empty function */
      };
      let arrayJob: RuntimeJob;

      beforeEach(() => {
        // Create Job with object based value
        objectSubscriptionContainer = dummyAgile.subController.subscribe(
          dummyFunction,
          [dummyObserver1]
        );
        dummyObserver1.value = {
          data: { name: 'jeff' },
        };
        dummyObserver1.previousValue = {
          data: { name: 'jeff' },
        };
        objectSubscriptionContainer.selectorsWeakMap.set(dummyObserver1, {
          methods: [(value) => value?.data?.name],
        });

        objectJob = new RuntimeJob(dummyObserver1, { key: 'dummyObjectJob1' });

        // Create Job with array based value
        arraySubscriptionContainer = dummyAgile.subController.subscribe(
          dummyFunction2,
          { dummyObserver2: dummyObserver2 }
        ).subscriptionContainer;
        dummyObserver2.value = [
          {
            data: { name: 'jeff' },
          },
          {
            data: { name: 'hans' },
          },
          {
            data: { name: 'frank' },
          },
        ];
        dummyObserver2.previousValue = [
          {
            data: { name: 'jeff' },
          },
          {
            data: { name: 'hans' },
          },
          {
            data: { name: 'frank' },
          },
        ];
        arraySubscriptionContainer.selectorsWeakMap.set(dummyObserver2, {
          methods: [
            (value) => value[0]?.data?.name,
            (value) => value[2]?.data?.name,
          ],
        });

        arrayJob = new RuntimeJob(dummyObserver2, { key: 'dummyObjectJob2' });

        jest.spyOn(Utils, 'notEqual');

        // Because not equals is called once during the creation of the Subscription Containers
        jest.clearAllMocks();
      });

      it('should return true if Subscription Container has no selector methods', () => {
        objectSubscriptionContainer.selectorsWeakMap.delete(dummyObserver1);

        const response = runtime.handleSelectors(
          objectSubscriptionContainer,
          objectJob
        );

        expect(response).toBeTruthy();
        expect(Utils.notEqual).not.toHaveBeenCalled();
      });

      it('should return true if selected property has changed (object value)', () => {
        dummyObserver1.value = {
          data: { name: 'changedName' },
        };

        const response = runtime.handleSelectors(
          objectSubscriptionContainer,
          objectJob
        );

        expect(response).toBeTruthy();

        expect(Utils.notEqual).toHaveBeenCalledTimes(1);
        expect(Utils.notEqual).toHaveBeenCalledWith(
          dummyObserver1.value.data.name,
          dummyObserver1.previousValue.data.name
        );
      });

      it("should return false if selected property hasn't changed (object value)", () => {
        const response = runtime.handleSelectors(
          objectSubscriptionContainer,
          objectJob
        );

        expect(response).toBeFalsy();

        expect(Utils.notEqual).toHaveBeenCalledTimes(1);
        expect(Utils.notEqual).toHaveBeenCalledWith(
          dummyObserver1.value.data.name,
          dummyObserver1.previousValue.data.name
        );
      });

      // TODO the deepness check isn't possible with the current way of handling selector methods
      // it('should return true if selected property has changed in the deepness (object value)', () => {
      //   dummyObserver1.value = {
      //     key: 'dummyObserverValue1',
      //   };
      //   dummyObserver1.previousValue = {
      //     key: 'dummyObserverValue1',
      //     data: { name: undefined },
      //   };
      //
      //   const response = runtime.handleSelectors(
      //     objectSubscriptionContainer,
      //     objectJob
      //   );
      //
      //   expect(response).toBeTruthy();
      //   expect(Utils.notEqual).toHaveBeenCalledWith(undefined, undefined);
      // });

      it('should return true if a selected property has changed (array value)', () => {
        dummyObserver2.value = [
          {
            data: { name: 'jeff' },
          },
          {
            data: { name: 'hans' },
          },
          {
            data: { name: 'changedName' },
          },
        ];

        const response = runtime.handleSelectors(
          arraySubscriptionContainer,
          arrayJob
        );

        expect(response).toBeTruthy();

        expect(Utils.notEqual).toHaveBeenCalledTimes(2);
        expect(Utils.notEqual).toHaveBeenCalledWith(
          dummyObserver2.value['0'].data.name,
          dummyObserver2.previousValue['0'].data.name
        );
        expect(Utils.notEqual).toHaveBeenCalledWith(
          dummyObserver2.value['2'].data.name,
          dummyObserver2.previousValue['2'].data.name
        );
      });

      it("should return false if used property hasn't changed (array value)", () => {
        dummyObserver2.value = [
          {
            data: { name: 'jeff' },
          },
          {
            data: { name: 'changedName (but not selected)' },
          },
          {
            data: { name: 'frank' },
          },
        ];

        const response = runtime.handleSelectors(
          arraySubscriptionContainer,
          arrayJob
        );

        expect(response).toBeFalsy();

        expect(Utils.notEqual).toHaveBeenCalledTimes(2);
        expect(Utils.notEqual).toHaveBeenCalledWith(
          dummyObserver2.value['0'].data.name,
          dummyObserver2.previousValue['0'].data.name
        );
        expect(Utils.notEqual).toHaveBeenCalledWith(
          dummyObserver2.value['2'].data.name,
          dummyObserver2.previousValue['2'].data.name
        );
      });
    });
  });
});
