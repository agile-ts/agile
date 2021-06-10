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
import testIntegration from '../../helper/test.integration';
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

      it("should perform specified Job immediately if jobQueue isn't currently being processed (default config)", () => {
        runtime.isPerformingJobs = false;

        runtime.ingest(dummyJob);

        expect(runtime.jobQueue.length).toBe(0);
        expect(runtime.perform).toHaveBeenCalledWith(dummyJob);
      });

      it("shouldn't perform specified Job immediately if jobQueue is currently being processed (default config)", () => {
        runtime.isPerformingJobs = true;

        runtime.ingest(dummyJob);

        expect(runtime.jobQueue.length).toBe(1);
        expect(runtime.jobQueue[0]).toBe(dummyJob);
        expect(runtime.perform).not.toHaveBeenCalled();
      });

      it('should perform specified Job immediately (config.perform = true)', () => {
        runtime.isPerformingJobs = true;
        runtime.ingest(dummyJob, { perform: true });

        expect(runtime.jobQueue.length).toBe(0);
        expect(runtime.perform).toHaveBeenCalledWith(dummyJob);
      });

      it("shouldn't perform specified Job immediately (config.perform = false)", () => {
        runtime.isPerformingJobs = false;
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

      it(
        'should perform specified Job and all remaining Jobs in the jobQueue,' +
          ' and call updateSubscribers if at least one performed Job needs to rerender',
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

          expect(runtime.jobQueue.length).toBe(0);
          expect(runtime.jobsToRerender.length).toBe(2);
          expect(runtime.jobsToRerender.includes(dummyJob1)).toBeTruthy();
          expect(runtime.jobsToRerender.includes(dummyJob2)).toBeTruthy();
          expect(runtime.jobsToRerender.includes(dummyJob3)).toBeFalsy();

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

        expect(dummyObserver1.ingest).toHaveBeenCalledWith({
          perform: false,
        });
        expect(dummyObserver1.ingest).toHaveBeenCalledTimes(1);
        expect(dummyObserver2.ingest).toHaveBeenCalledWith({
          perform: false,
        });
        expect(dummyObserver2.ingest).toHaveBeenCalledTimes(1);
      });

      it(
        'should perform specified Job and all remaining Jobs in the jobQueue' +
          " and shouldn't call updateSubscribes if no performed Job needs to rerender",
        async () => {
          dummyJob1.rerender = false;
          runtime.jobQueue.push(dummyJob3);

          runtime.perform(dummyJob1);

          expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob1);
          expect(dummyJob1.performed).toBeTruthy();
          expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob3);
          expect(dummyJob3.performed).toBeTruthy();

          expect(runtime.jobQueue.length).toBe(0);
          expect(runtime.jobsToRerender.length).toBe(0);

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
        runtime.jobsToRerender.push(dummyJob1);
        runtime.jobsToRerender.push(dummyJob2);

        const response = runtime.updateSubscribers();

        expect(response).toBeFalsy();
        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);
        expect(
          runtime.extractToUpdateSubscriptionContainer
        ).not.toHaveBeenCalled();
        expect(runtime.updateSubscriptionContainer).not.toHaveBeenCalled();
      });

      it('should return false if jobsToRerender and notReadyJobsToRerender queue is empty', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        runtime.jobsToRerender = [];
        runtime.notReadyJobsToRerender = new Set();

        const response = runtime.updateSubscribers();

        expect(response).toBeFalsy();
      });

      it('should return false if no Subscription Container of the Jobs to rerender needs to update', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        jest
          .spyOn(runtime, 'extractToUpdateSubscriptionContainer')
          .mockReturnValueOnce([]);
        runtime.jobsToRerender.push(dummyJob1);
        runtime.jobsToRerender.push(dummyJob2);
        runtime.notReadyJobsToRerender.add(dummyJob3);

        const response = runtime.updateSubscribers();

        expect(response).toBeFalsy();
        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);
        expect(
          runtime.extractToUpdateSubscriptionContainer
        ).toHaveBeenCalledWith([dummyJob1, dummyJob2, dummyJob3]);
        expect(runtime.updateSubscriptionContainer).not.toHaveBeenCalled();
      });

      it('should return true if at least one Subscription Container of the Jobs to rerender needs to update', () => {
        dummyAgile.hasIntegration = jest.fn(() => true);
        jest
          .spyOn(runtime, 'extractToUpdateSubscriptionContainer')
          .mockReturnValueOnce([
            dummySubscriptionContainer1,
            dummySubscriptionContainer2,
          ]);
        runtime.jobsToRerender.push(dummyJob1);
        runtime.jobsToRerender.push(dummyJob2);
        runtime.notReadyJobsToRerender.add(dummyJob3);

        const response = runtime.updateSubscribers();

        expect(response).toBeTruthy();
        expect(runtime.jobsToRerender).toStrictEqual([]);
        expect(runtime.notReadyJobsToRerender.size).toBe(0);
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
      // TODO
    });

    describe('updateSubscriptionContainer function tests', () => {
      // TODO
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
        subscriptionContainer.updatedSubscribers.push(dummyObserver1);
        subscriptionContainer.updatedSubscribers.push(dummyObserver2);
        subscriptionContainer.updatedSubscribers.push(dummyObserver3);

        const props = runtime.getUpdatedObserverValues(subscriptionContainer);

        expect(props).toStrictEqual({
          dummyObserver1KeyInObserver: 'dummyObserverValue1',
          dummyObserver2KeyInWeakMap: undefined,
          dummyObserver3KeyInWeakMap: 'dummyObserverValue3',
        });
        expect(subscriptionContainer.updatedSubscribers).toStrictEqual([
          dummyObserver1,
          dummyObserver2,
          dummyObserver3,
        ]);
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
        ];
        dummyObserver2.previousValue = [
          {
            key: 'dummyObserver2Value1',
            data: { name: 'jeff' },
          },
          {
            key: 'dummyObserver2Value2',
            data: { name: 'hans' },
          },
        ];
        arraySubscriptionContainer.selectorsWeakMap.set(dummyObserver2, {
          methods: [(value) => value[0]?.data?.name],
        });

        arrayJob = new RuntimeJob(dummyObserver2, { key: 'dummyObjectJob2' });

        jest.spyOn(Utils, 'notEqual');

        // Because not equals is called once during the creation of the Subscription Containers
        jest.clearAllMocks();
      });

      it('should return true if Subscritpion Container has no selector methods', () => {
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
          key: 'dummyObserverValue1',
          data: { name: 'hans' },
        };

        const response = runtime.handleSelectors(
          objectSubscriptionContainer,
          objectJob
        );

        expect(response).toBeTruthy();
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
        expect(Utils.notEqual).toHaveBeenCalledWith(
          dummyObserver1.value.data.name,
          dummyObserver1.previousValue.data.name
        );
      });

      // TODO the deepness check isn't possible with the custom defined selector methods
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

      it('should return true if used property has changed (array value)', () => {
        dummyObserver2.value = [
          {
            key: 'dummyObserver2Value1',
            data: { name: 'frank' },
          },
          {
            key: 'dummyObserver2Value2',
            data: { name: 'hans' },
          },
        ];

        const response = runtime.handleSelectors(
          arraySubscriptionContainer,
          arrayJob
        );

        expect(response).toBeTruthy();
        expect(Utils.notEqual).toHaveBeenCalledWith(
          dummyObserver2.value['0'].data.name,
          dummyObserver2.previousValue['0'].data.name
        );
      });

      it("should return false if used property hasn't changed (array value)", () => {
        const response = runtime.handleSelectors(
          arraySubscriptionContainer,
          arrayJob
        );

        expect(response).toBeFalsy();
        expect(Utils.notEqual).toHaveBeenCalledWith(
          dummyObserver2.value['0'].data.name,
          dummyObserver2.previousValue['0'].data.name
        );
      });
    });
  });
});
