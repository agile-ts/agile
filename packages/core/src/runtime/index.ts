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

  // Job that is currently performed
  public currentJob: RuntimeJob | null = null;
  // Jobs to perform
  public jobQueue: Array<RuntimeJob> = [];

  // Jobs that were performed and are ready to rerender
  public jobsToRerender: Array<RuntimeJob> = [];
  // Jobs that were performed and should rerender
  // but the Subscription Container isn't ready to rerender it yet
  // For example if the UI-Component isn't mounted yet.
  public notReadyJobsToRerender: Set<RuntimeJob> = new Set();

  // Whether Jobs are currently performed
  public isPerformingJobs = false;

  /**
   * The Runtime queues and performs ingested Observer change Jobs.
   *
   * It prevents race conditions and combines Job Subscription Container rerenders.
   *
   * @internal
   * @param agileInstance - Instance of Agile the Runtime belongs to.
   */
  constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
  }

  /**
   * Adds the specified Job to the Job queue,
   * where it will be performed when it is its turn.
   *
   * @internal
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
   * After the execution it checks if there is still a Job in the queue.
   * If so, the next Job in the queue is performed.
   * If not, the `jobsToRerender` queue will be started to work off.
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
    // since they depend on the Observer and might have been changed
    job.observer.dependents.forEach((observer) =>
      observer.ingest({ perform: false })
    );

    // Add Job to rerender queue and reset current Job property
    if (job.rerender) this.jobsToRerender.push(job);
    this.currentJob = null;

    Agile.logger.if
      .tag(['runtime'])
      .info(LogCodeManager.getLog('16:01:01', [job._key]), job);

    // Perform Jobs as long as Jobs are left in the queue
    // If no job left start updating/rerendering Subscribers of jobsToRerender
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
   * Executes the `jobsToRerender` queue
   * and updates (causes rerender on) the Subscription Container (subscribed Component)
   * of each Job Observer.
   *
   * @internal
   * @return A boolean indicating whether any Subscription Container was updated.
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

    // Subscription Containers that have to be updated (perform rerender on Component it represents).
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

        // Handle Selectors
        updateSubscriptionContainer = this.handleSelectors(
          subscriptionContainer,
          job
        );

        // Check if Subscription Container with same componentId is already in the 'subscriptionToUpdate' queue
        // (rerender optimisation)
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

    // Update Subscription Containers (trigger rerender on subscribed Component)
    subscriptionsToUpdate.forEach((subscriptionContainer) => {
      // Call 'callback function' if Callback based Subscription
      if (subscriptionContainer instanceof CallbackSubscriptionContainer)
        subscriptionContainer.callback();

      // Call 'update method' if Component based Subscription
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
   * Maps the values of the updated Observers into a key map.
   *
   * @internal
   * @param subscriptionContainer - Subscription Container from which the 'updatedSubscribers' are to be mapped to a key map.
   */
  public getUpdatedObserverValues(
    subscriptionContainer: SubscriptionContainer
  ): { [key: string]: any } {
    const props: { [key: string]: any } = {};

    // Map updated Observer values into the props key map
    for (const observer of subscriptionContainer.updatedSubscribers) {
      const key =
        subscriptionContainer.subscriberKeysWeakMap.get(observer) ??
        subscriptionContainer.key;
      if (key != null) props[key] = observer.value;
    }
    return props;
  }

  /**
   * Returns a boolean indicating whether the Subscription Container can be updated or not.
   * Therefore it reviews the '.value' and the '.previousValue' property of the Observer the Job represents.
   * If a selected property differs, the Subscription Container is allowed to update/rerender.
   *
   * @internal
   * @param subscriptionContainer - Subscription Container to be checked if it can update.
   * @param job - Job the Subscription Container belongs to.
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
    if (!selectors) return true;

    // Check if a selected part of Observer value has changed
    const previousValue = job.observer.previousValue;
    const newValue = job.observer.value;
    for (const selector of selectors) {
      if (
        notEqual(selector(newValue), selector(previousValue))
        // || newValueDeepness !== previousValueDeepness // Not possible to check
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
