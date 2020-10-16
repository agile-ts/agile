import {
  Agile,
  SubscriptionContainer,
  defineConfig,
  Observer,
  Job,
  JobConfigInterface,
  CallbackSubscriptionContainer,
  ComponentSubscriptionContainer,
} from "../internal";

export class Runtime {
  public agileInstance: () => Agile;

  // Queue system
  private currentJob: Job | null = null;
  private jobQueue: Array<Job> = [];
  private notReadyJobsToRerender: Array<Job> = []; // Jobs that are performed but not ready to rerender (wait for mount)
  private jobsToRerender: Array<Job> = []; // Jobs that are performed and will be rendered

  // Tracking - Used to track computed dependencies
  public trackObservers: boolean = false; // Check if agile should track observers
  public foundObservers: Set<Observer> = new Set(); // States which were tracked during the trackObservers time

  /**
   * Runtime - Handles changes of Observers
   * @param {Agile} agileInstance - An instance of Agile
   */
  constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Ingests Observer into runtime which will than be performed
   * @param {Observer} observer - Observer you want to perform
   * @param {JobConfigInterface} config - Config
   */
  public ingest(observer: Observer, config: JobConfigInterface): void {
    config = defineConfig<JobConfigInterface>(config, {
      perform: true,
      background: false,
      sideEffects: true,
    });

    const job = new Job(observer, {
      background: config.background,
      sideEffects: config.sideEffects,
    });

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(`Agile: Created Job(${job.observer.key})`, job);

    // Add Job to JobQueue (so no Job get missing)
    this.jobQueue.push(job);

    // Perform the Job and remove it from jobQueue
    if (config.perform) {
      const performJob = this.jobQueue.shift();
      if (performJob) this.perform(performJob);
      else console.warn("Agile: No Job in queue!");
    }
  }

  //=========================================================================================================
  // Perform
  //=========================================================================================================
  /**
   * @internal
   * Performs Job
   * @param {Job} job - Job you want to perform
   */
  private perform(job: Job): void {
    this.currentJob = job;

    // Perform Job
    job.observer.perform(job);
    job.performed = true;

    if (job.rerender) this.jobsToRerender.push(job);

    // Reset currentJob since it has been performed
    this.currentJob = null;

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(`Agile: Completed Job(${job.observer.key})`, job);

    // Perform Jobs as long Jobs are left in queue, if no job left update Subscribers of performed Jobs
    if (this.jobQueue.length > 0) {
      const performJob = this.jobQueue.shift();
      if (performJob) this.perform(performJob);
      else console.warn("Agile: No Job in queue!");
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
   * Updates all Subscribers of Jobs that have to be rerendered
   */
  private updateSubscribers(): void {
    if (!this.agileInstance().integrations.hasIntegration()) {
      this.jobsToRerender = [];
      return;
    }

    // Subscriptions that has to be updated (Set = For preventing double subscriptions without further checks)
    const subscriptionsToUpdate: Set<SubscriptionContainer> = new Set<
      SubscriptionContainer
    >();

    // Handle Object based Jobs and check if Job is ready
    this.jobsToRerender.concat(this.notReadyJobsToRerender).forEach((job) => {
      job.observer.dep.subs.forEach((subscriptionContainer) => {
        // Check if Subscription is ready to rerender
        if (!subscriptionContainer.ready) {
          this.notReadyJobsToRerender.push(job);
          if (this.agileInstance().config.logJobs)
            console.warn(
              "Agile: SubscriptionContainer isn't ready to rerender!",
              subscriptionContainer
            );
          return;
        }

        // For a Container that require props to be passed
        if (subscriptionContainer.passProps)
          this.handlePassProps(subscriptionContainer, job);

        subscriptionsToUpdate.add(subscriptionContainer);
      });
    });

    // Update Subscriptions that has to be updated/rerendered
    subscriptionsToUpdate.forEach((subscriptionContainer) => {
      // Call callback function if Callback based Subscription
      if (subscriptionContainer instanceof CallbackSubscriptionContainer)
        subscriptionContainer.callback();

      // Call update method if Component based Subscription
      if (subscriptionContainer instanceof ComponentSubscriptionContainer)
        this.agileInstance().integrations.update(
          subscriptionContainer.component,
          this.formatChangedPropKeys(subscriptionContainer)
        );
    });

    // Logging
    if (this.agileInstance().config.logJobs && subscriptionsToUpdate.size > 0)
      console.log("Agile: Rerendered Subscriptions ", subscriptionsToUpdate);

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

    // Find localKey of the Job Observer
    for (let key in subscriptionContainer.subsObject)
      if (subscriptionContainer.subsObject[key] === job.observer)
        localKey = key;

    // Add localKey to propKeysChanged if it got found (since since the observer with that key has changed)
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

    // Map trough changed Keys and build finalObject which will be passed into update function
    subscriptionContainer.propKeysChanged.forEach((changedKey) => {
      // Check if SubscriptionContainer has value if so add it to the final Object
      if (
        subscriptionContainer.subsObject &&
        subscriptionContainer.subsObject[changedKey]["value"]
      )
        finalObject[changedKey] =
          subscriptionContainer.subsObject[changedKey]["value"];
    });

    return finalObject;
  }

  //=========================================================================================================
  // Get Tracked Observers
  //=========================================================================================================
  /**
   * @internal
   * Returns tracked Observers and stops runtime from tracking Observers
   */
  public getTrackedObservers(): Set<Observer> {
    const finalFoundObservers = this.foundObservers;

    // Reset tracking
    this.trackObservers = false;
    this.foundObservers = new Set();

    return finalFoundObservers;
  }
}
