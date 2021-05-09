import {
  Agile,
  SubscriptionContainer,
  RuntimeJob,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
  defineConfig,
  notEqual,
  isValidObject,
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

    // Logging
    Agile.logger.if.tag(['runtime']).info(`Created Job '${job._key}'`, job);

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

    // Logging
    Agile.logger.if.tag(['runtime']).info(`Completed Job '${job._key}'`, job);

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

            // Logging
            Agile.logger.warn(
              "SubscriptionContainer/Component isn't ready to rerender!",
              subscriptionContainer
            );
          } else {
            // Logging
            Agile.logger.warn(
              `Job with not ready SubscriptionContainer/Component was removed from the runtime after ${job.config.numberOfTriesToUpdate} tries to avoid an overflow.`,
              subscriptionContainer
            );
          }
          return;
        }

        // Handle Object based Subscription
        if (subscriptionContainer.isObjectBased)
          this.handleObjectBasedSubscription(subscriptionContainer, job);

        // Check if subscriptionContainer should be updated
        const updateSubscriptionContainer = subscriptionContainer.proxyBased
          ? this.handleProxyBasedSubscription(subscriptionContainer, job)
          : true;

        if (updateSubscriptionContainer)
          subscriptionsToUpdate.add(subscriptionContainer);

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
          this.getObjectBasedProps(subscriptionContainer)
        );
    });

    // Logging
    Agile.logger.if
      .tag(['runtime'])
      .info('Updated/Rerendered Subscriptions', subscriptionsToUpdate);

    return true;
  }

  //=========================================================================================================
  // Handle Object Based Subscription
  //=========================================================================================================
  /**
   * @internal
   * Finds key of Observer (Job) in subsObject and adds it to 'changedObjectKeys'
   * @param subscriptionContainer - Object based SubscriptionContainer
   * @param job - Job that holds the searched Observer
   */
  public handleObjectBasedSubscription(
    subscriptionContainer: SubscriptionContainer,
    job: RuntimeJob
  ): void {
    let foundKey: string | null = null;

    // Check if SubscriptionContainer is Object based
    if (!subscriptionContainer.isObjectBased) return;

    // Find Key of Job Observer in SubscriptionContainer
    for (const key in subscriptionContainer.subsObject)
      if (subscriptionContainer.subsObject[key] === job.observer)
        foundKey = key;

    if (foundKey) subscriptionContainer.observerKeysToUpdate.push(foundKey);
  }

  //=========================================================================================================
  // Get Object Based Props
  //=========================================================================================================
  /**
   * @internal
   * Builds Object out of changedObjectKeys with Observer Value
   * @param subscriptionContainer - Object based SubscriptionContainer
   */
  public getObjectBasedProps(
    subscriptionContainer: SubscriptionContainer
  ): { [key: string]: any } {
    const props: { [key: string]: any } = {};

    // Map trough observerKeysToUpdate and build object out of Observer value
    if (subscriptionContainer.subsObject)
      for (const updatedKey of subscriptionContainer.observerKeysToUpdate)
        props[updatedKey] = subscriptionContainer.subsObject[updatedKey]?.value;

    subscriptionContainer.observerKeysToUpdate = [];
    return props;
  }

  //=========================================================================================================
  // Handle Proxy Based Subscription
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
  public handleProxyBasedSubscription(
    subscriptionContainer: SubscriptionContainer,
    job: RuntimeJob
  ): boolean {
    // Return true because in this cases the subscriptionContainer isn't properly proxyBased
    if (
      !subscriptionContainer.proxyBased ||
      !job.observer._key ||
      !subscriptionContainer.proxyKeyMap[job.observer._key]
    )
      return true;

    const paths = subscriptionContainer.proxyKeyMap[job.observer._key].paths;

    if (paths) {
      for (const path of paths) {
        // Get property in new Value located at path
        let newValue = job.observer.value;
        let newValueDeepness = 0;
        for (const branch of path) {
          if (!isValidObject(newValue, true)) break;
          newValue = newValue[branch];
          newValueDeepness++;
        }

        // Get property in previous Value located at path
        let previousValue = job.observer.previousValue;
        let previousValueDeepness = 0;
        for (const branch of path) {
          if (!isValidObject(previousValue, true)) break;
          previousValue = previousValue[branch];
          previousValueDeepness++;
        }

        // Check if found values differ
        if (
          notEqual(newValue, previousValue) ||
          newValueDeepness !== previousValueDeepness
        ) {
          return true;
        }
      }
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
