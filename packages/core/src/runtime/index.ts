import {
  Agile,
  SubscriptionContainer,
  Observer,
  Job,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
  CreateJobConfigInterface,
  defineConfig,
} from "../internal";

export class Runtime {
  public agileInstance: () => Agile;

  // Queue system
  public currentJob: Job | null = null;
  public jobQueue: Array<Job> = [];
  public notReadyJobsToRerender: Set<Job> = new Set(); // Jobs that got performed but aren't ready to get rerendered (wait for mount)
  public jobsToRerender: Array<Job> = []; // Jobs that are performed and will be rendered

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
   * Ingests Observer into Runtime
   * -> Creates Job which will be performed by the Runtime
   * @param observer - Observer that gets performed by the Runtime
   * @param config - Config
   */
  public ingest(observer: Observer, config: IngestConfigInterface = {}): void {
    config = defineConfig(config, {
      perform: true,
    });

    const job = new Job(observer, {
      storage: config.storage,
      sideEffects: config.sideEffects,
      force: config.force,
      background: config.background,
      key: config.key || observer.key,
    });
    this.jobQueue.push(job);

    // Logging
    Agile.logger.if
      .tag(["runtime"])
      .info(`Created Job '${job.observer.key}'`, job);

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
  public perform(job: Job): void {
    this.currentJob = job;

    // Perform Job
    job.observer.perform(job);
    job.performed = true;

    if (job.rerender) this.jobsToRerender.push(job);
    this.currentJob = null;

    // Logging
    Agile.logger.if
      .tag(["runtime"])
      .info(`Completed Job '${job.observer.key}'`, job);

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

        subscriptionsToUpdate.add(subscriptionContainer);
        job.subscriptionContainersToUpdate.delete(subscriptionContainer);
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
      .tag(["runtime"])
      .info("Updated/Rerendered Subscriptions", subscriptionsToUpdate);

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
    job: Job
  ): void {
    let foundKey: string | null = null;

    // Check if SubscriptionContainer is Object based
    if (!subscriptionContainer.isObjectBased) return;

    // Find Key of Job Observer in SubscriptionContainer
    for (let key in subscriptionContainer.subsObject)
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
    subscriptionContainer.observerKeysToUpdate.forEach((updatedKey) => {
      if (
        subscriptionContainer.subsObject &&
        subscriptionContainer.subsObject[updatedKey]["value"]
      )
        props[updatedKey] =
          subscriptionContainer.subsObject[updatedKey]["value"];
    });

    subscriptionContainer.observerKeysToUpdate = [];
    return props;
  }
}

/**
 * @param perform - If Job gets performed immediately
 */
export interface IngestConfigInterface extends CreateJobConfigInterface {
  perform?: boolean;
}
