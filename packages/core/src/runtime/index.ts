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

  // Tracking - Used to track computed dependencies
  public trackObservers = false;
  public foundObservers: Set<Observer> = new Set(); // Observers that got tracked (reset after stop tracking)

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
      key: config.key,
    });
    this.jobQueue.push(job);

    // Logging
    Agile.logger.if
      .tag(["runtime"])
      .info(`Created Job(${job.observer.key})`, job);

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
  public updateSubscribers(): void {
    if (!this.agileInstance().hasIntegration()) {
      this.jobsToRerender = [];
      this.notReadyJobsToRerender = new Set();
      return;
    }
    if (this.jobsToRerender.length <= 0) return;

    // Subscriptions that has to be updated/rerendered (Set = For preventing double subscriptions without further checks)
    const subscriptionsToUpdate: Set<SubscriptionContainer> = new Set<
      SubscriptionContainer
    >();

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

    // Update Subscriptions that has to be updated/rerendered
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
  }

  //=========================================================================================================
  // Handle Object Based Subscription
  //=========================================================================================================
  /**
   * @internal
   * Finds updated Key of SubscriptionContainer and adds it to 'changedObjectKeys'
   * @param subscriptionContainer - Object based SubscriptionContainer
   * @param job - Job that holds the SubscriptionContainer
   */
  public handleObjectBasedSubscription(
    subscriptionContainer: SubscriptionContainer,
    job: Job
  ): void {
    let localKey: string | null = null;

    if (!subscriptionContainer.isObjectBased) return;

    // Find localKey of Job Observer in SubscriptionContainer
    for (let key in subscriptionContainer.subsObject)
      if (subscriptionContainer.subsObject[key] === job.observer)
        localKey = key;

    // Add localKey to changedObjectKeys
    if (localKey) subscriptionContainer.changedObjectKeys.push(localKey);
  }

  //=========================================================================================================
  // Get Object Based Props
  //=========================================================================================================
  /**
   * @internal
   * Builds Object from 'changedObjectKeys' with new Values provided by Observers
   * @param subscriptionContainer - SubscriptionContainer from which the Object gets built
   */
  public getObjectBasedProps(
    subscriptionContainer: SubscriptionContainer
  ): { [key: string]: any } {
    const finalObject: { [key: string]: any } = {};

    // Map trough changed Keys and build finalObject
    subscriptionContainer.changedObjectKeys.forEach((changedKey) => {
      // Check if Observer at changedKey has value property, if so add it to final Object
      if (
        subscriptionContainer.subsObject &&
        subscriptionContainer.subsObject[changedKey]["value"]
      )
        finalObject[changedKey] =
          subscriptionContainer.subsObject[changedKey]["value"];
    });

    subscriptionContainer.changedObjectKeys = [];
    return finalObject;
  }

  //=========================================================================================================
  // Get Tracked Observers
  //=========================================================================================================
  /**
   * @internal
   * Returns tracked Observers and stops Runtime from tracking anymore Observers
   */
  public getTrackedObservers(): Set<Observer> {
    const finalFoundObservers = this.foundObservers;

    // Reset tracking
    this.trackObservers = false;
    this.foundObservers = new Set();

    return finalFoundObservers;
  }
}

/**
 * @param perform - If Job gets performed immediately
 */
export interface IngestConfigInterface extends CreateJobConfigInterface {
  perform?: boolean;
}
