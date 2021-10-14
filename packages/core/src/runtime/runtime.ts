import { defineConfig, notEqual } from '@agile-ts/utils';
import { logCodeManager } from '../logCodeManager';
import { Agile } from '../agile';
import {
  SubscriptionContainer,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
} from './subscription';
import { RuntimeJob } from './runtime.job';

export class Runtime {
  // Agile Instance the Runtime belongs to
  public agileInstance: () => Agile;

  // Job that is currently being performed
  public currentJob: RuntimeJob | null = null;
  // Jobs to be performed
  public jobQueue: Array<RuntimeJob> = [];

  // Jobs that were performed and are ready to re-render
  public jobsToRerender: Array<RuntimeJob> = [];
  // Jobs that were performed and couldn't be re-rendered yet.
  // That is the case when at least one Subscription Container (UI-Component) in the Job
  // wasn't ready to update (re-render).
  public notReadyJobsToRerender: Set<RuntimeJob> = new Set();

  // Whether the `jobQueue` is currently being actively processed
  public isPerformingJobs = false;

  // Current 'bucket' timeout 'scheduled' for updating the Subscribers (UI-Components)
  public bucketTimeout: NodeJS.Timeout | null = null;

  /**
   * The Runtime queues and executes incoming Observer-based Jobs
   * to prevent [race conditions](https://en.wikipedia.org/wiki/Race_condition#:~:text=A%20race%20condition%20or%20race,the%20possible%20behaviors%20is%20undesirable.)
   * and optimized the re-rendering of the Observer's subscribed UI-Components.
   *
   * Each queued Job is executed when it is its turn
   * by calling the Job Observer's `perform()` method.
   *
   * After successful execution, the Job is added to a re-render queue,
   * which is first put into the browser's 'Bucket' and started to work off
   * when resources are left.
   *
   * The re-render queue is designed for optimizing the render count
   * by batching multiple re-render Jobs of the same UI-Component
   * and ignoring re-render requests for unmounted UI-Components.
   *
   * @internal
   * @param agileInstance - Instance of Agile the Runtime belongs to.
   */
  constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
  }

  /**
   * Adds the specified Observer-based Job to the internal Job queue,
   * where it is executed when it is its turn.
   *
   * After successful execution, the Job is assigned to the re-render queue,
   * where all the Observer's subscribed Subscription Containers (UI-Components)
   * are updated (re-rendered).
   *
   * @public
   * @param job - Job to be added to the Job queue.
   * @param config - Configuration object
   */
  public ingest(job: RuntimeJob, config: IngestConfigInterface = {}): void {
    config = defineConfig(config, {
      perform: !this.isPerformingJobs,
    });

    // Add specified Job to the queue
    this.jobQueue.push(job);

    if (process.env.NODE_ENV !== 'production') {
      logCodeManager.log(
        '16:01:00',
        { tags: ['runtime'], replacers: [job.key] },
        job
      );
    }

    // Run first Job from the queue
    if (config.perform) {
      const performJob = this.jobQueue.shift();
      if (performJob) this.perform(performJob);
    }
  }

  /**
   * Performs the specified Job
   * and assigns it to the re-render queue if necessary.
   *
   * After the execution of the provided Job, it is checked whether
   * there are still Jobs left in the Job queue.
   * - If so, the next Job in the `jobQueue` is performed.
   * - If not, the `jobsToRerender` queue is started to work off.
   *
   * @internal
   * @param job - Job to be performed.
   */
  public perform(job: RuntimeJob): void {
    this.isPerformingJobs = true;
    this.currentJob = job;

    // Perform Job
    job.observer.perform(job);
    job.performed = true;

    // Ingest dependents of the Observer into runtime,
    // since they depend on the Observer and therefore have properly changed too
    job.observer.dependents.forEach((observer) => observer.ingest());

    // Add Job to rerender queue and reset current Job property
    if (job.rerender) this.jobsToRerender.push(job);
    this.currentJob = null;

    if (process.env.NODE_ENV !== 'production') {
      logCodeManager.log(
        '16:01:01',
        { tags: ['runtime'], replacers: [job.key] },
        job
      );
    }

    // Perform Jobs as long as Jobs are left in the queue.
    // If no Job is left start updating (re-rendering) Subscription Container (UI-Components)
    // of the Job based on the 'jobsToRerender' queue.
    if (this.jobQueue.length > 0) {
      const performJob = this.jobQueue.shift();
      if (performJob) this.perform(performJob);
    } else {
      this.isPerformingJobs = false;
      if (this.jobsToRerender.length > 0) {
        if (this.agileInstance().config.bucket) {
          // Check if an bucket timeout is active, if so don't call a new one,
          // since if the active timeout is called it will also proceed Jobs
          // that were not added before the call
          if (this.bucketTimeout == null) {
            // https://stackoverflow.com/questions/9083594/call-settimeout-without-delay
            this.bucketTimeout = setTimeout(() => {
              this.bucketTimeout = null;
              this.updateSubscribers();
            });
          }
        } else this.updateSubscribers();
      }
    }
  }

  /**
   * Processes the `jobsToRerender` queue by updating (causing a re-render on)
   * the subscribed Subscription Containers (UI-Components) of each Job Observer.
   *
   * It returns a boolean indicating whether
   * any Subscription Container (UI-Component) was updated (re-rendered) or not.
   *
   * @internal
   */
  public updateSubscribers(): boolean {
    // Build final 'jobsToRerender' array
    // based on the new 'jobsToRerender' array and the 'notReadyJobsToRerender' array
    const jobsToRerender = this.jobsToRerender.concat(
      Array.from(this.notReadyJobsToRerender)
    );
    this.notReadyJobsToRerender = new Set();
    this.jobsToRerender = [];

    if (!this.agileInstance().hasIntegration() || jobsToRerender.length <= 0)
      return false;

    // Extract the Subscription Container to be re-rendered from the Jobs
    const subscriptionContainerToUpdate =
      this.extractToUpdateSubscriptionContainer(jobsToRerender);
    if (subscriptionContainerToUpdate.length <= 0) return false;

    // Update Subscription Container (trigger re-render on the UI-Component they represent)
    this.updateSubscriptionContainer(subscriptionContainerToUpdate);

    return true;
  }

  /**
   * Extracts the Subscription Containers (UI-Components)
   * to be updated (re-rendered) from the specified Runtime Jobs.
   *
   * @internal
   * @param jobs - Jobs from which to extract the Subscription Containers to be updated.
   */
  public extractToUpdateSubscriptionContainer(
    jobs: Array<RuntimeJob>
  ): Array<SubscriptionContainer> {
    // https://medium.com/@bretcameron/how-to-make-your-code-faster-using-javascript-sets-b432457a4a77
    const subscriptionsToUpdate = new Set<SubscriptionContainer>();

    // Using for loop for performance optimization
    // https://stackoverflow.com/questions/43821759/why-array-foreach-is-slower-than-for-loop-in-javascript
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      job.subscriptionContainersToUpdate.forEach((subscriptionContainer) => {
        let updateSubscriptionContainer = true;

        // Handle not ready Subscription Container
        if (!subscriptionContainer.ready) {
          if (
            !job.config.maxTriesToUpdate ||
            job.timesTriedToUpdateCount < job.config.maxTriesToUpdate
          ) {
            job.timesTriedToUpdateCount++;
            this.notReadyJobsToRerender.add(job);
            if (process.env.NODE_ENV !== 'production') {
              logCodeManager.log(
                '16:02:00',
                { replacers: [subscriptionContainer.key] },
                subscriptionContainer
              );
            }
          } else {
            if (process.env.NODE_ENV !== 'production') {
              logCodeManager.log(
                '16:02:01',
                { replacers: [job.config.maxTriesToUpdate] },
                subscriptionContainer
              );
            }
          }
          return;
        }

        // TODO has to be overthought because when it is a Component based Subscription
        //  the rerender is triggered via merging the changed properties into the Component.
        //  Although the 'componentId' might be equal, it doesn't mean
        //  that the changed properties are equal! (-> changed properties might get missing)
        // Check if Subscription Container with same 'componentId'
        // is already in the 'subscriptionToUpdate' queue (rerender optimisation)
        // updateSubscriptionContainer =
        //   updateSubscriptionContainer &&
        //   Array.from(subscriptionsToUpdate).findIndex(
        //     (sc) => sc.componentId === subscriptionContainer.componentId
        //   ) === -1;

        // Check whether a selected part of the Observer value has changed
        updateSubscriptionContainer =
          updateSubscriptionContainer &&
          this.handleSelectors(subscriptionContainer, job);

        // Add Subscription Container to the 'subscriptionsToUpdate' queue
        if (updateSubscriptionContainer) {
          subscriptionContainer.updatedSubscribers.add(job.observer);
          subscriptionsToUpdate.add(subscriptionContainer);
        }

        job.subscriptionContainersToUpdate.delete(subscriptionContainer);
      });
    }

    return Array.from(subscriptionsToUpdate);
  }

  /**
   * Updates the specified Subscription Containers.
   *
   * Updating a Subscription Container triggers a re-render
   * on the Component it represents, based on the type of the Subscription Containers.
   *
   * @internal
   * @param subscriptionsToUpdate - Subscription Containers to be updated.
   */
  public updateSubscriptionContainer(
    subscriptionsToUpdate: Array<SubscriptionContainer>
  ): void {
    // Using for loop for performance optimization
    // https://stackoverflow.com/questions/43821759/why-array-foreach-is-slower-than-for-loop-in-javascript
    for (let i = 0; i < subscriptionsToUpdate.length; i++) {
      const subscriptionContainer = subscriptionsToUpdate[i];

      // Call 'callback function' if Callback based Subscription
      if (subscriptionContainer instanceof CallbackSubscriptionContainer)
        subscriptionContainer.callback();

      // Call 'update method' in Integrations if Component based Subscription
      if (subscriptionContainer instanceof ComponentSubscriptionContainer)
        this.agileInstance().integrations.update(
          subscriptionContainer.component,
          this.getUpdatedObserverValues(subscriptionContainer)
        );

      subscriptionContainer.updatedSubscribers.clear();
    }

    if (process.env.NODE_ENV !== 'production') {
      logCodeManager.log(
        '16:01:02',
        { tags: ['runtime'] },
        subscriptionsToUpdate
      );
    }
  }

  /**
   * Maps the values of the updated Observers (`updatedSubscribers`)
   * of the specified Subscription Container into a key map object.
   *
   * The key containing the Observer value is extracted from the Observer itself
   * or from the Subscription Container's `subscriberKeysWeakMap`.
   *
   * @internal
   * @param subscriptionContainer - Subscription Container from which the `updatedSubscribers` are to be mapped into a key map.
   */
  public getUpdatedObserverValues(
    subscriptionContainer: SubscriptionContainer
  ): { [key: string]: any } {
    const props: { [key: string]: any } = {};
    for (const observer of subscriptionContainer.updatedSubscribers) {
      const key =
        subscriptionContainer.subscriberKeysWeakMap.get(observer) ??
        observer.key;
      if (key != null) props[key] = observer.value;
    }
    return props;
  }

  /**
   * Returns a boolean indicating whether the specified Subscription Container can be updated or not,
   * based on its selector functions (`selectorsWeakMap`).
   *
   * This is done by checking the '.value' and the '.previousValue' property of the Observer represented by the Job.
   * If a selected property differs, the Subscription Container (UI-Component) is allowed to update (re-render)
   * and `true` is returned.
   *
   * If the Subscription Container has no selector function at all, `true` is returned.
   *
   * @internal
   * @param subscriptionContainer - Subscription Container to be checked if it can be updated.
   * @param job - Job containing the Observer that is subscribed to the Subscription Container.
   */
  public handleSelectors(
    subscriptionContainer: SubscriptionContainer,
    job: RuntimeJob
  ): boolean {
    const selectorMethods = subscriptionContainer.selectorsWeakMap.get(
      job.observer
    )?.methods;

    // If no selector functions found, return true.
    // Because no specific part of the Observer was selected.
    // -> The Subscription Container should be updated
    //    no matter what has updated in the Observer.
    if (selectorMethods == null) return true;

    // Check if a selected part of the Observer value has changed
    const previousValue = job.observer.previousValue;
    const newValue = job.observer.value;
    if (!previousValue && !newValue) return false; // Because not all Observers contain a value/previousValue
    for (const selectorMethod of selectorMethods) {
      if (
        notEqual(selectorMethod(newValue), selectorMethod(previousValue))
        // || newValueDeepness !== previousValueDeepness // Not possible to check the object deepness
      )
        return true;
    }

    return false;
  }
}

export interface IngestConfigInterface {
  /**
   * Whether the ingested Job should be performed immediately
   * or added to the queue first and then executed when it is his turn.
   */
  perform?: boolean;
}
