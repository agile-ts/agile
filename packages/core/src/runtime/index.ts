import {
  Agile,
  SubscriptionContainer,
  RuntimeJob,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
  defineConfig,
  notEqual,
  LogCodeManager,
} from '../internal';

export class Runtime {
  // Agile Instance the Runtime belongs to
  public agileInstance: () => Agile;

  // Job that is currently being performed
  public currentJob: RuntimeJob | null = null;
  // Jobs to be performed
  public jobQueue: Array<RuntimeJob> = [];

  // Jobs that were performed and are ready to rerender
  public jobsToRerender: Array<RuntimeJob> = [];
  // Jobs that were performed and should be rerendered.
  // However their Subscription Container isn't ready to rerender yet.
  // For example when the UI-Component isn't mounted yet.
  public notReadyJobsToRerender: Set<RuntimeJob> = new Set();

  // Whether the job queue is currently being actively processed
  public isPerformingJobs = false;

  /**
   * The Runtime executes and queues ingested Observer based Jobs
   * to prevent race conditions and optimized rerender of subscribed Components.
   *
   * Each provided Job will be executed when it is its turn
   * by calling the Job Observer's 'perform()' method.
   *
   * After a successful execution the Job is added to a rerender queue,
   * which is firstly put into the browser's 'Bucket' and executed when resources are left.
   *
   * The rerender queue is designed for optimizing the render count
   * by combining rerender Jobs of the same Component
   * and ignoring rerender requests for unmounted Components.
   *
   * @internal
   * @param agileInstance - Instance of Agile the Runtime belongs to.
   */
  constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
  }

  /**
   * Adds the specified Observer based Job to the internal Job queue,
   * where it will be performed when it is its turn.
   *
   * After a successful execution it is added to the rerender queue,
   * where all the Observer's subscribed Subscription Containers
   * cause rerender on Components the Observer is represented in.
   *
   * @public
   * @param job - Job to be performed.
   * @param config - Configuration object
   */
  public ingest(job: RuntimeJob, config: IngestConfigInterface = {}): void {
    config = defineConfig(config, {
      perform: !this.isPerformingJobs,
    });

    // Add specified Job to the queue
    this.jobQueue.push(job);

    Agile.logger.if
      .tag(['runtime'])
      .info(LogCodeManager.getLog('16:01:00', [job._key]), job);

    // Run first Job from the queue
    if (config.perform) {
      const performJob = this.jobQueue.shift();
      if (performJob) this.perform(performJob);
    }
  }

  /**
   * Performs the specified Job
   * and adds it to the rerender queue if necessary.
   *
   * After the execution of the provided Job it is checked whether
   * there are still Jobs left in the Job queue.
   * - If so, the next Job in the queue is performed.
   * - If not, the `jobsToRerender` queue will be started to work off.
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
    // since they depend on the Observer and have properly changed too
    job.observer.dependents.forEach((observer) =>
      observer.ingest({ perform: false })
    );

    // Add Job to rerender queue and reset current Job property
    if (job.rerender) this.jobsToRerender.push(job);
    this.currentJob = null;

    Agile.logger.if
      .tag(['runtime'])
      .info(LogCodeManager.getLog('16:01:01', [job._key]), job);

    // Perform Jobs as long as Jobs are left in the queue.
    // If no Job is left start updating/rerendering Subscribers
    // of the Job based on the 'jobsToRerender' queue.
    if (this.jobQueue.length > 0) {
      const performJob = this.jobQueue.shift();
      if (performJob) this.perform(performJob);
    } else {
      this.isPerformingJobs = false;
      if (this.jobsToRerender.length > 0) {
        // https://stackoverflow.com/questions/9083594/call-settimeout-without-delay
        setTimeout(() => {
          this.updateSubscribers();
        });
      }
    }
  }

  /**
   * Works of the `jobsToRerender` queue by updating (causing rerender on)
   * the Subscription Container (subscribed Component)
   * of each Job Observer.
   *
   * It returns a boolean indicating whether any Subscription Container was updated.
   *
   * @internal
   */
  public updateSubscribers(): boolean {
    if (!this.agileInstance().hasIntegration()) {
      this.jobsToRerender = [];
      this.notReadyJobsToRerender = new Set();
      return false;
    }
    if (
      this.jobsToRerender.length <= 0 &&
      this.notReadyJobsToRerender.size <= 0
    )
      return false;

    // Subscription Containers that have to be updated.
    // Using a 'Set()' to combine several equal SubscriptionContainers into one (rerender optimisation).
    const subscriptionsToUpdate = new Set<SubscriptionContainer>();

    // Build final 'jobsToRerender' array
    // based on the new 'jobsToRerender' array and the 'notReadyJobsToRerender' array.
    const jobsToRerender = this.jobsToRerender.concat(
      Array.from(this.notReadyJobsToRerender)
    );
    this.notReadyJobsToRerender = new Set();
    this.jobsToRerender = [];

    // Check if Job Subscription Container of Jobs should be updated
    // and if so add it to the 'subscriptionsToUpdate' array
    jobsToRerender.forEach((job) => {
      job.subscriptionContainersToUpdate.forEach((subscriptionContainer) => {
        if (!subscriptionContainer.ready) {
          if (
            !job.config.numberOfTriesToUpdate ||
            job.triesToUpdate < job.config.numberOfTriesToUpdate
          ) {
            job.triesToUpdate++;
            this.notReadyJobsToRerender.add(job);

            LogCodeManager.log(
              '16:02:00',
              [subscriptionContainer.key],
              subscriptionContainer
            );
          } else {
            LogCodeManager.log(
              '16:02:01',
              [job.config.numberOfTriesToUpdate],
              subscriptionContainer
            );
          }
          return;
        }

        let updateSubscriptionContainer;

        // Handle Selectors of Subscription Container
        // (-> check if a selected part of the Observer value has changed)
        updateSubscriptionContainer = this.handleSelectors(
          subscriptionContainer,
          job
        );

        // Check if Subscription Container with same 'componentId'
        // is already in the 'subscriptionToUpdate' queue (rerender optimisation)
        updateSubscriptionContainer =
          updateSubscriptionContainer &&
          Array.from(subscriptionsToUpdate).findIndex(
            (sc) => sc.componentId === subscriptionContainer.componentId
          ) === -1;

        // Add Subscription Container to the 'subscriptionsToUpdate' queue
        if (updateSubscriptionContainer) {
          subscriptionContainer.updatedSubscribers.push(job.observer);
          subscriptionsToUpdate.add(subscriptionContainer);
        }

        job.subscriptionContainersToUpdate.delete(subscriptionContainer);
      });
    });

    if (subscriptionsToUpdate.size <= 0) return false;

    // Update Subscription Containers (trigger rerender on Components they represent)
    subscriptionsToUpdate.forEach((subscriptionContainer) => {
      // Call 'callback function' if Callback based Subscription
      if (subscriptionContainer instanceof CallbackSubscriptionContainer)
        subscriptionContainer.callback();

      // Call 'update method' in Integrations if Component based Subscription
      if (subscriptionContainer instanceof ComponentSubscriptionContainer)
        this.agileInstance().integrations.update(
          subscriptionContainer.component,
          this.getUpdatedObserverValues(subscriptionContainer)
        );

      subscriptionContainer.updatedSubscribers = [];
    });

    Agile.logger.if
      .tag(['runtime'])
      .info(LogCodeManager.getLog('16:01:02'), subscriptionsToUpdate);

    return true;
  }

  /**
   * Maps the values of updated Observers (`updatedSubscribers`)
   * of the specified Subscription Container into a key map.
   *
   * The key containing the Observer value is extracted from the Observer itself
   * or from the Subscription Container's `subscriberKeysWeakMap`.
   *
   * @internal
   * @param subscriptionContainer - Subscription Container from which the `updatedSubscribers` are to be mapped to a key map.
   */
  public getUpdatedObserverValues(
    subscriptionContainer: SubscriptionContainer
  ): { [key: string]: any } {
    const props: { [key: string]: any } = {};
    for (const observer of subscriptionContainer.updatedSubscribers) {
      const key =
        subscriptionContainer.subscriberKeysWeakMap.get(observer) ??
        subscriptionContainer.key;
      if (key != null) props[key] = observer.value;
    }
    return props;
  }

  /**
   * Returns a boolean indicating whether the specified Subscription Container can be updated or not
   * based on the selector functions (`selectorsWeakMap`) of the Subscription Container.
   *
   * This is done by checking the '.value' and the '.previousValue' property of the Observer represented by the Job.
   * If a selected property differs, the Subscription Container is allowed to update/rerender (returns true).
   *
   * @internal
   * @param subscriptionContainer - Subscription Container to be checked if it can update.
   * @param job - Job containing the Observer which has subscribed the Subscription Container.
   */
  public handleSelectors(
    subscriptionContainer: SubscriptionContainer,
    job: RuntimeJob
  ): boolean {
    const selectors = subscriptionContainer.selectorsWeakMap.get(job.observer)
      ?.selectors;

    // If no selector functions found, return true
    // because no specific part of the Observer was selected
    // -> The Subscription Container should update
    // no matter what was updated in the Observer
    if (selectors == null) return true;

    // Check if a selected part of Observer value has changed
    const previousValue = job.observer.previousValue;
    const newValue = job.observer.value;
    for (const selector of selectors) {
      if (
        notEqual(selector(newValue), selector(previousValue))
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
