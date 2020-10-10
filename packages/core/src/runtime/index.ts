import {
  Agile,
  SubscriptionContainer,
  defineConfig,
  Observer,
  Job,
  JobConfigInterface,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
  StateObserver,
  SubController,
} from "../internal";

export class Runtime {
  public agileInstance: () => Agile;

  public subController: SubController; // Handles the subscriptions to an component

  // Queue system
  private currentJob: Job | null = null;
  private jobQueue: Array<Job> = [];
  private notReadyJobsToRerender: Array<Job> = [];
  private jobsToRerender: Array<Job> = [];

  // Used for tracking computed dependencies
  public trackObserver: boolean = false; // Check if agile should track states
  public foundObservers: Set<Observer> = new Set(); // States which were tracked during the track time

  constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
    this.subController = new SubController(agileInstance);
  }

  public ingest(observer: Observer, options: JobConfigInterface): void {
    options = defineConfig<JobConfigInterface>(options, {
      perform: true,
      background: false,
      sideEffects: true,
      forceRerender: false,
    });

    // Create Job
    const job = new Job(observer, {
      background: options.background,
      sideEffects: options.sideEffects,
      forceRerender: options.forceRerender,
    });

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(`Agile: Created Job(${job.observer.key})`, job);

    // Push the Job to the Queue
    this.jobQueue.push(job);

    // Perform the Job and remove it from queue
    if (options.perform) {
      const performJob = this.jobQueue.shift();
      if (performJob) this.perform(performJob);
      else console.warn("Agile: No Job in queue ", job);
    }
  }

  //=========================================================================================================
  // Perform
  //=========================================================================================================
  /**
   * @internal
   * Perform a State Update
   */
  private perform(job: Job): void {
    this.currentJob = job;

    // Perform Job
    job.observer.perform(job);
    job.performed = true;

    // Add to rerender
    if (job.rerender) this.jobsToRerender.push(job);

    // Reset Current Job
    this.currentJob = null;

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(`Agile: Completed Job(${job.observer.key})`, job);

    // Continue the Loop and perform the next job.. if no job is left update the Subscribers for each completed job
    if (this.jobQueue.length > 0) {
      const performJob = this.jobQueue.shift();
      if (performJob) this.perform(performJob);
    } else {
      // https://stackoverflow.com/questions/9083594/call-settimeout-without-delay
      setTimeout(() => {
        this.updateSubscribers();
      });
    }
  }

  //=========================================================================================================
  // Update Subscribers
  //=========================================================================================================
  /**
   * @internal
   * Updates all Subscribers
   */
  private updateSubscribers(): void {
    // Subscriptions that has to be updated
    const subscriptionsToUpdate: Set<SubscriptionContainer> = new Set<
      SubscriptionContainer
    >();

    // Map through Jobs to Rerender
    this.jobsToRerender.concat(this.notReadyJobsToRerender).forEach((job) =>
      job.observer.dep.subs.forEach((subscriptionContainer) => {
        // Check if subscriptionContainer is ready
        if (!subscriptionContainer.ready) {
          this.notReadyJobsToRerender.push(job);
          if (this.agileInstance().config.logJobs)
            console.warn(
              "Agile: SubscriptionContainer isn't ready yet ",
              subscriptionContainer
            );
          return;
        }

        // For a Container that require props to be passed
        if (subscriptionContainer.passProps)
          this.handlePassProps(subscriptionContainer, job);

        subscriptionsToUpdate.add(subscriptionContainer);
      })
    );

    // Rerender the Components via CallbackSubscriptions or ComponentSubscription
    subscriptionsToUpdate.forEach((subscriptionContainer) => {
      if (subscriptionContainer instanceof CallbackSubscriptionContainer)
        subscriptionContainer.callback();

      if (subscriptionContainer instanceof ComponentSubscriptionContainer)
        this.agileInstance().integrations.update(
          subscriptionContainer.component,
          this.formatChangedPropKeys(subscriptionContainer)
        );
    });

    // Log Job
    if (this.agileInstance().config.logJobs && subscriptionsToUpdate.size > 0)
      console.log("Agile: Rerendered Components ", subscriptionsToUpdate);

    // Reset Jobs to Rerender
    this.jobsToRerender = [];
  }

  //=========================================================================================================
  // Handle Pass Props
  //=========================================================================================================
  /**
   * @internal
   * Handle prop passing subscription
   */
  public handlePassProps(
    subscriptionContainer: SubscriptionContainer,
    job: Job
  ) {
    let localKey: string | null = null;

    // Find the local Key for this update by comparing the State instance from this Job to the State instances in the propStates object
    for (let key in subscriptionContainer.subs)
      if (subscriptionContainer.subs[key] === job.observer) localKey = key;

    // If matching key is found push it into the SubscriptionContainer propKeysChanged where it later will be build to an changed prop object
    if (localKey) subscriptionContainer.propKeysChanged.push(localKey);
  }

  //=========================================================================================================
  // Format Changed Prop Keys
  //=========================================================================================================
  /**
   * @internal
   * Builds an object out of propKeysChanged in the SubscriptionContainer
   */
  public formatChangedPropKeys(
    subscriptionContainer: SubscriptionContainer
  ): { [key: string]: any } {
    const finalObject: { [key: string]: any } = {};

    // Build Object
    subscriptionContainer.propKeysChanged.forEach((changedKey) => {
      if (subscriptionContainer.subs[changedKey] instanceof StateObserver)
        finalObject[changedKey] = subscriptionContainer.subs[changedKey].value;
    });

    return finalObject;
  }

  //=========================================================================================================
  // Get Found State
  //=========================================================================================================
  /**
   * @internal
   * Will return all tracked States
   */
  public getTrackedObservers(): Set<Observer> {
    const finalFoundObservers = this.foundObservers;

    // Reset tracking
    this.trackObserver = false;
    this.foundObservers = new Set();

    return finalFoundObservers;
  }
}
