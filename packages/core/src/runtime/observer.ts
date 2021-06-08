import {
  Agile,
  StateKey,
  RuntimeJob,
  SubscriptionContainer,
  defineConfig,
  IngestConfigInterface,
  CreateRuntimeJobConfigInterface,
  LogCodeManager,
} from '../internal';

export type ObserverKey = string | number;

export class Observer<ValueType = any> {
  // Agile Instance the Observer belongs to
  public agileInstance: () => Agile;

  // Key/Name identifier of the Subscription Container
  public _key?: ObserverKey;
  // Observers that depend on this Observer
  public dependents: Set<Observer> = new Set();
  // Subscription Containers (Components) the Observer is subscribed to
  public subscribedTo: Set<SubscriptionContainer> = new Set();
  // Current value of Observer
  public value?: ValueType;
  // Previous value of Observer
  public previousValue?: ValueType;

  /**
   * Handles the subscriptions to Subscription Containers (Components)
   * and keeps track of dependencies.
   *
   * All Agile Classes that can be bound a UI-Component have their own Observer
   * which manages the above mentioned things for them.
   *
   * The Observer is no standalone class and should be extended from a 'real' Observer.
   *
   * @internal
   * @param agileInstance - Instance of Agile the Observer belongs to.
   * @param config - Configuration object
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
    config.dependents?.forEach((observer) => this.addDependent(observer));
    config.subs?.forEach((subscriptionContainer) =>
      subscriptionContainer.addSubscription(this)
    );
  }

  /**
   * Updates the key/name identifier of the Observer.
   *
   * @public
   * @param value - New key/name identifier.
   */
  public set key(value: StateKey | undefined) {
    this._key = value;
  }

  /**
   * Returns the key/name identifier of the State.
   *
   * @public
   */
  public get key(): StateKey | undefined {
    return this._key;
  }

  /**
   * Ingests the Observer into the runtime,
   * by creating a Runtime Job
   * and adding the Observer to the created Job.
   *
   * @public
   * @param config - Configuration object
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

  /**
   * Method executed by the Runtime to perform the Runtime Job,
   * previously ingested (`ingest()`) by the Observer.
   *
   * @public
   * @param job - Runtime Job to be performed.
   */
  public perform(job: RuntimeJob): void {
    LogCodeManager.log('17:03:00');
  }

  /**
   * Adds specified Observer to the dependents of this Observer.
   *
   * Every time this Observer is ingested into the Runtime,
   * the dependent Observers are ingested into the Runtime too.
   *
   * @public
   * @param observer - Observer to depends on this Observer.
   */
  public addDependent(observer: Observer): void {
    if (!this.dependents.has(observer)) this.dependents.add(observer);
  }
}

/**
 * @param deps - Initial Dependents of Observer
 * @param subs - Initial Subscriptions of Observer
 * @param key - Key/Name of Observer
 * @param value - Initial Value of Observer
 */
export interface CreateObserverConfigInterface<ValueType = any> {
  /**
   * Initial Observers that depend on this Observer.
   * @default []
   */
  dependents?: Array<Observer>;
  /**
   * Initial Subscription Container the Observer is subscribed to.
   * @default []
   */
  subs?: Array<SubscriptionContainer>;
  /**
   * Key/Name identifier of the Observer.
   * @default undefined
   */
  key?: ObserverKey;
  /**
   * Initial value of the Observer.
   * @defualt undefined
   */
  value?: ValueType;
}

export interface ObserverIngestConfigInterface
  extends CreateRuntimeJobConfigInterface,
    IngestConfigInterface {}
