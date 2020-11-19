import { Agile, StateKey, Job, SubscriptionContainer } from "../internal";

export type ObserverKey = string | number;

export class Observer<ValueType = any> {
  public agileInstance: () => Agile;

  public _key?: ObserverKey;
  public deps: Set<Observer> = new Set(); // Observers that depends on this Observer
  public subs: Set<SubscriptionContainer> = new Set(); // SubscriptionContainers(Components) which this Observer has subscribed
  public value?: ValueType; // Value of Observer

  /**
   * @internal
   * Observer - Handles subscriptions and dependencies of an Agile Class and is like an instance to the Runtime
   * @param agileInstance - An instance of Agile
   * @param value - Initial Value of Observer
   * @param deps - Initial Dependencies of Observer
   * @param key - Key/Name of Observer
   */
  constructor(
    agileInstance: Agile,
    deps?: Array<Observer>,
    key?: ObserverKey,
    value?: ValueType
  ) {
    this.agileInstance = () => agileInstance;
    this._key = key;
    this.value = value;
    deps?.forEach((observer) => this.deps.add(observer));
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
  // Perform
  //=========================================================================================================
  /**
   * @internal
   * Performs Job of Runtime
   * @param job - Job that gets performed
   */
  public perform(job: Job) {
    Agile.logger.warn("Didn't set perform function in Observer ", this.key);
  }

  //=========================================================================================================
  // Depend
  //=========================================================================================================
  /**
   * @internal
   * Adds Dependency to Observer that will be ingested into the Runtime if this Observer changes
   * @param observer - Observer that will depend on this Observer
   */
  public depend(observer: Observer) {
    if (!this.deps.has(observer)) this.deps.add(observer);
  }

  //=========================================================================================================
  // Subscribe
  //=========================================================================================================
  /**
   * @internal
   * Adds Subscription to Observer
   * @param subscriptionContainer - SubscriptionContainer(Component) that gets subscribed by this Observer
   */
  public subscribe(subscriptionContainer: SubscriptionContainer) {
    if (!this.subs.has(subscriptionContainer))
      this.subs.add(subscriptionContainer);
  }

  //=========================================================================================================
  // Unsubscribe
  //=========================================================================================================
  /**
   * @internal
   * Removes Subscription from Observer
   * @param subscriptionContainer - SubscriptionContainer(Component) that gets unsubscribed by this Observer
   */
  public unsubscribe(subscriptionContainer: SubscriptionContainer) {
    if (this.subs.has(subscriptionContainer))
      this.subs.delete(subscriptionContainer);
  }
}
