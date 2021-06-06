import {
  Agile,
  SubscriptionContainer,
  RuntimeJob,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
  defineConfig,
  notEqual,
  isValidObject,
  LogCodeManager,
} from '../internal';

export class Runtime {
  public agileInstance: () => Agile;

  // Queue system
  public currentJob: RuntimeJob | null = null;
  public jobQueue: Array<RuntimeJob> = [];
  public notReadyJobsToRerender: Set<RuntimeJob> = new Set(); // Jobs that got performed but aren't ready to get rerendered (wait for mount)
  public jobsToRerender: Array<RuntimeJob> = []; // Jobs that are performed and will be rendered

  /**
   * @internal
   * Runtime - Performs ingested Observers
   * @param agileInstance - An instance of Agile
   */
  constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Ingests Job into Runtime that gets performed
   * @param job - Job
   * @param config - Config
   */
  public ingest(job: RuntimeJob, config: IngestConfigInterface = {}): void {
    config = defineConfig(config, {
      perform: true,
    });

    this.jobQueue.push(job);

    Agile.logger.if
      .tag(['runtime'])
      .info(LogCodeManager.getLog('16:01:00', [job._key]), job);

    // Perform Job
    if (config.perform) {
      const performJob = this.jobQueue.shift();
      if (performJob) this.perform(performJob);
    }
  }

  //=========================================================================================================
  // Perform
  //=========================================================================================================
  /**
   * @internal
   * Performs Job and adds it to the rerender queue if necessary
   * @param job - Job that gets performed
   */
  public perform(job: RuntimeJob): void {
    this.currentJob = job;

    // Perform Job
    job.observer.perform(job);
    job.performed = true;

    // Ingest Dependents of Observer into Runtime
    job.observer.dependents.forEach((observer) =>
      observer.ingest({ perform: false })
    );

    if (job.rerender) this.jobsToRerender.push(job);
    this.currentJob = null;

    Agile.logger.if
      .tag(['runtime'])
      .info(LogCodeManager.getLog('16:01:01', [job._key]), job);

    // Perform Jobs as long as Jobs are left in queue, if no job left update/rerender Subscribers of jobsToRerender
    if (this.jobQueue.length > 0) {
      const performJob = this.jobQueue.shift();
      if (performJob) this.perform(performJob);
    } else {
      if (this.jobsToRerender.length > 0) {
        // https://stackoverflow.com/questions/9083594/call-settimeout-without-delay
        setTimeout(() => {
          this.updateSubscribers();
        });
      }
    }
  }

  //=========================================================================================================
  // Update Subscribers
  //=========================================================================================================
  /**
   * @internal
   * Updates/Rerenders all Subscribed Components (SubscriptionContainer) of the Job (Observer)
   * @return If any subscriptionContainer got updated (-> triggered a rerender on the Component it represents)
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

    // Subscriptions that has to be updated/rerendered
    // A Set() to combine several equal SubscriptionContainers into one (optimizes rerender)
    // (Even better would be to combine SubscriptionContainer based on the Component,
    // since a Component can have multiple SubscriptionContainers)
    const subscriptionsToUpdate = new Set<SubscriptionContainer>();

    // Build final jobsToRerender array based on new jobsToRerender and not ready jobsToRerender
    const jobsToRerender = this.jobsToRerender.concat(
      Array.from(this.notReadyJobsToRerender)
    );
    this.notReadyJobsToRerender = new Set();
    this.jobsToRerender = [];

    // Check if Job SubscriptionContainers should be updated and if so add them to the subscriptionsToUpdate array
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

        let updateSubscriptionContainer = true;

        // Handle Selectors
        updateSubscriptionContainer = this.handleSelectors(
          subscriptionContainer,
          job
        );

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
   * Returns a key map with Observer values that have been updated.
   *
   * @internal
   * @param subscriptionContainer - Object based SubscriptionContainer
   */
  public getUpdatedObserverValues(
    subscriptionContainer: SubscriptionContainer
  ): { [key: string]: any } {
    const props: { [key: string]: any } = {};

    // Map 'Observer To Update' values into the props object
    for (const observer of subscriptionContainer.updatedSubscribers) {
      const key = subscriptionContainer.subscriberKeysWeakMap.get(observer);
      if (key != null) props[key] = observer.value;
    }
    return props;
  }

  //=========================================================================================================
  // Handle Selectors
  //=========================================================================================================
  /**
   * @internal
   * Checks if the subscriptionContainer should be updated.
   * Therefore it reviews the '.value' and the '.previousValue' property of the Observer the Job represents.
   * If a property at the proxy detected path differs, the subscriptionContainer is allowed to update.
   * @param subscriptionContainer - SubscriptionContainer
   * @param job - Job
   * @return {boolean} If the subscriptionContainer should be updated
   * -> If a from the Proxy Tree detected property differs from the same property in the previous value
   * or the passed subscriptionContainer isn't properly proxy based
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

/**
 * @param perform - If Job gets performed immediately
 */
export interface IngestConfigInterface {
  perform?: boolean;
}
