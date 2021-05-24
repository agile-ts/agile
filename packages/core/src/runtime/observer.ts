import {
  Agile,
  StateKey,
  RuntimeJob,
  SubscriptionContainer,
  defineConfig,
  IngestConfigInterface,
  CreateRuntimeJobConfigInterface,
  LoggingHandler,
} from '../internal';

export type ObserverKey = string | number;

export class Observer<ValueType = any> {
  public agileInstance: () => Agile;

  public _key?: ObserverKey;
  public dependents: Set<Observer> = new Set(); // Observers that depend on this Observer
  public subscribedTo: Set<SubscriptionContainer> = new Set(); // SubscriptionContainers (Components) that this Observer is subscribed to
  public value?: ValueType; // Value of Observer
  public previousValue?: ValueType; // Previous Value of Observer

  /**
   * @internal
   * Observer - Handles subscriptions and dependencies of an Agile Class and is like an instance to the Runtime
   * Note: No stand alone class!!
   * @param agileInstance - An instance of Agile
   * @param config - Config
   */
  constructor(
    agileInstance: Agile,
    config: CreateObserverConfigInterface<ValueType> = {}
  ) {
    config = defineConfig(config, {
      dependents: [],
      subs: [],
    });
    this.agileInstance = () => agileInstance;
    this._key = config.key;
    this.value = config.value;
    this.previousValue = config.value;
    config.dependents?.forEach((observer) => this.depend(observer));
    config.subs?.forEach((subscriptionContainer) =>
      this.subscribe(subscriptionContainer)
    );
  }

  /**
   * @internal
   * Set Key/Name of Observer
   */
  public set key(value: StateKey | undefined) {
    this._key = value;
  }

  /**
   * @internal
   * Get Key/Name of Observer
   */
  public get key(): StateKey | undefined {
    return this._key;
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Ingests Observer into Runtime
   * @param config - Configuration
   */
  public ingest(config: ObserverIngestConfigInterface = {}): void {
    config = defineConfig(config, {
      perform: true,
      background: false,
      sideEffects: {
        enabled: true,
        exclude: [],
      },
      force: false,
    });

    // Create Job
    const job = new RuntimeJob(this, {
      force: config.force,
      sideEffects: config.sideEffects,
      background: config.background,
      key: config.key || this._key,
    });

    this.agileInstance().runtime.ingest(job, {
      perform: config.perform,
    });
  }

  //=========================================================================================================
  // Perform
  //=========================================================================================================
  /**
   * @internal
   * Performs Job of Runtime
   * @param job - Job that gets performed
   */
  public perform(job: RuntimeJob): void {
    LoggingHandler.logs.classMethodXNotSet('perform', 'Observer');
  }

  //=========================================================================================================
  // Depend
  //=========================================================================================================
  /**
   * @internal
   * Adds Dependent to Observer which gets ingested into the Runtime whenever this Observer mutates
   * @param observer - Observer that will depend on this Observer
   */
  public depend(observer: Observer): void {
    if (!this.dependents.has(observer)) this.dependents.add(observer);
  }

  //=========================================================================================================
  // Subscribe
  //=========================================================================================================
  /**
   * @internal
   * Adds Subscription to Observer
   * @param subscriptionContainer - SubscriptionContainer(Component) that gets subscribed by this Observer
   */
  public subscribe(subscriptionContainer: SubscriptionContainer): void {
    if (!this.subscribedTo.has(subscriptionContainer)) {
      this.subscribedTo.add(subscriptionContainer);

      // Add this to subscriptionContainer to keep track of the Observers the subscriptionContainer hold
      subscriptionContainer.subscribers.add(this);
    }
  }

  //=========================================================================================================
  // Unsubscribe
  //=========================================================================================================
  /**
   * @internal
   * Removes Subscription from Observer
   * @param subscriptionContainer - SubscriptionContainer(Component) that gets unsubscribed by this Observer
   */
  public unsubscribe(subscriptionContainer: SubscriptionContainer): void {
    if (this.subscribedTo.has(subscriptionContainer)) {
      this.subscribedTo.delete(subscriptionContainer);
      subscriptionContainer.subscribers.delete(this);
    }
  }
}

/**
 * @param deps - Initial Dependents of Observer
 * @param subs - Initial Subscriptions of Observer
 * @param key - Key/Name of Observer
 * @param value - Initial Value of Observer
 */
export interface CreateObserverConfigInterface<ValueType = any> {
  dependents?: Array<Observer>;
  subs?: Array<SubscriptionContainer>;
  key?: ObserverKey;
  value?: ValueType;
}

export interface ObserverIngestConfigInterface
  extends CreateRuntimeJobConfigInterface,
    IngestConfigInterface {}
