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
  public trackObservers: boolean = false; // Check if Runtime have to track Observers
  public foundObservers: Set<Observer> = new Set(); // Observers that got tracked during the 'trackObservers' time

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
   * Ingests Observer into Runtime and creates Job
   * @param observer - Observer that gets performed by the Runtime
   * @param config - Config
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

    // Add Job to JobQueue (-> no Job get missing)
    this.jobQueue.push(job);

    // Perform Job
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
   * Performs Job and add it to rerender queue if necessary
   * @param job - Job that gets performed
   */
  private perform(job: Job): void {
    this.currentJob = job;

    // Perform Job
    job.observer.perform(job);
    job.performed = true;

    if (job.rerender) this.jobsToRerender.push(job);
    this.currentJob = null;

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(`Agile: Completed Job(${job.observer.key})`, job);

    // Perform Jobs as long as Jobs are in queue, if no job left update/rerender Subscribers of performed Jobs
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
   * Updates all Subscribers of Job
   */
  private updateSubscribers(): void {
    if (!this.agileInstance().integrations.hasIntegration()) {
      this.jobsToRerender = [];
      return;
    }

    // Subscriptions that has to be updated/rerendered (Set = For preventing double subscriptions without further checks)
    const subscriptionsToUpdate: Set<SubscriptionContainer> = new Set<
      SubscriptionContainer
    >();

    // Handle Object based Jobs and checks if Job is ready
    this.jobsToRerender.concat(this.notReadyJobsToRerender).forEach((job) => {
      job.observer.subs.forEach((subscriptionContainer) => {
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

        if (subscriptionContainer.isObjectBased)
          this.handleObjectBasedSubscription(subscriptionContainer, job);

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
          this.getObjectBasedProps(subscriptionContainer)
        );
    });

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(
        "Agile: Updated/Rerendered Subscriptions ",
        subscriptionsToUpdate
      );

    this.jobsToRerender = [];
  }

  //=========================================================================================================
  // Handle Object Based Subscription
  //=========================================================================================================
  /**
   * @internal
   * Finds updated Key of SubscriptionContainer and adds it to 'objectKeysChanged'
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

    // Add localKey to objectKeysChanged
    if (localKey) subscriptionContainer.objectKeysChanged.push(localKey);
  }

  //=========================================================================================================
  // Get Object Based Props
  //=========================================================================================================
  /**
   * @internal
   * Builds Object out of 'objectKeysChanged' with new Values provided by Observers
   * @param subscriptionContainer - SubscriptionContainer from which the Object gets built
   */
  public getObjectBasedProps(
    subscriptionContainer: SubscriptionContainer
  ): { [key: string]: any } {
    const finalObject: { [key: string]: any } = {};

    // Map trough changed Keys and build finalObject
    subscriptionContainer.objectKeysChanged.forEach((changedKey) => {
      // Check if Observer at changedKey has value property, if so add it to final Object
      if (
        subscriptionContainer.subsObject &&
        subscriptionContainer.subsObject[changedKey]["value"]
      )
        finalObject[changedKey] =
          subscriptionContainer.subsObject[changedKey]["value"];
    });

    subscriptionContainer.objectKeysChanged = [];
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
