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
   * Updates/Rerenders all Subscribed Components of the Job (Observer)
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
    // 'Set' to combine several SubscriptionContainers that are equals into one (optimizes rerender)
    // Better would be to optimize the rerender based on the Component, because a Component can have multiple SubscriptionContainers
    const subscriptionsToUpdate = new Set<SubscriptionContainer>();

    // Build final jobsToRerender and reset jobsToRerender Instances
    const jobsToRerender = this.jobsToRerender.concat(
      Array.from(this.notReadyJobsToRerender)
    );
    this.notReadyJobsToRerender = new Set();
    this.jobsToRerender = [];

    // Check if Job Subscriptions are ready and add them to subscriptionsToUpdate
    jobsToRerender.forEach((job) => {
      job.subscriptionContainersToUpdate.forEach((subscriptionContainer) => {
        if (!subscriptionContainer.ready) {
          this.notReadyJobsToRerender.add(job);

          // Logging
          Agile.logger.warn(
            "SubscriptionContainer/Component isn't ready to rerender!",
            subscriptionContainer
          );
          return;
        }

        // Handle Object based Subscription
        if (subscriptionContainer.isObjectBased)
          this.handleObjectBasedSubscription(subscriptionContainer, job);

        // Check if proxy property has changed
        if (subscriptionContainer.proxyBased && job.observer._key) {
          const paths =
            subscriptionContainer.proxyKeyMap[job.observer._key].paths;

          Agile.logger.debug('Paths', paths);

          if (paths) {
            for (const path of paths) {
              let newValue = job.observer.value;
              for (const branch of path) {
                if (!isValidObject(newValue)) break;
                newValue = newValue[branch];
              }

              let previousValue = job.observer.previousValue;
              for (const branch of path) {
                if (!isValidObject(previousValue)) break;
                previousValue = previousValue[branch];
              }

              Agile.logger.debug(
                'NewValue vs previousValue',
                newValue,
                previousValue
              );

              // Check if value has changed, if so add it to the rerender queue
              if (notEqual(newValue, previousValue)) {
                Agile.logger.debug(
                  'Rerender Subscription Container (Proxy)',
                  subscriptionContainer
                );
                subscriptionsToUpdate.add(subscriptionContainer);
                job.subscriptionContainersToUpdate.delete(
                  subscriptionContainer
                );
                break;
              }
            }
          }
        } else {
          subscriptionsToUpdate.add(subscriptionContainer);
          job.subscriptionContainersToUpdate.delete(subscriptionContainer);
        }
      });
    });

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
}

/**
 * @param perform - If Job gets performed immediately
 */
export interface IngestConfigInterface {
  perform?: boolean;
}
