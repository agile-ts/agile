import { Agile, StateKey, Job, SubscriptionContainer } from "../internal";

export type ObserverKey = string | number;

export class Observer<ValueType = any> {
  public agileInstance: () => Agile;

  public _key?: ObserverKey;
  public deps: Set<Observer> = new Set(); // Dependencies (Other Observers)
  public subs: Set<SubscriptionContainer> = new Set(); // Subscriptions (Components) which the Observer has subscribed
  public value?: ValueType; // Value of Observer

  /**
   * @internal
   * Observers - Handles subscriptions and dependencies and is like an instance to the Runtime
   * Note: No stand alone class!
   * @param {Agile} agileInstance - An instance of Agile
   * @param {ValueType} value - Value of Observer
   * @param {Array<Observer>} deps - Initial Dependencies of the Observer
   * @param {ObserverKey} key - Key/Name of the Observer
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
    deps?.forEach((observable) => this.deps.add(observable));
  }

  public set key(value: StateKey | undefined) {
    this._key = value;
  }

  public get key(): StateKey | undefined {
    return this._key;
  }

  //=========================================================================================================
  // Perform
  //=========================================================================================================
  /**
   * @internal
   * Performs a Job
   * @param {Job<this>} job - The Job which should be performed
   */
  public perform(job: Job) {
    console.warn("Didn't set perform function in Observer ", this.key);
  }

  //=========================================================================================================
  // Depend
  //=========================================================================================================
  /**
   * @internal
   * Add new Dependency
   * @param {Observer} observer - Observer which should depend on this Observer
   */
  public depend(observer: Observer) {
    if (!this.deps.has(observer)) this.deps.add(observer);
  }

  //=========================================================================================================
  // Subscribe
  //=========================================================================================================
  /**
   * @internal
   * Add new Subscription
   * @param {SubscriptionContainer} subscriptionContainer - SubscriptionContainer (Component) which the Observer should subscribe
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
   * Remove Subscription
   * @param {SubscriptionContainer} subscriptionContainer - SubscriptionContainer (Component) which the Observer should unsubscribe
   */
  public unsubscribe(subscriptionContainer: SubscriptionContainer) {
    if (this.subs.has(subscriptionContainer))
      this.subs.delete(subscriptionContainer);
  }
}
