import { defineConfig } from '@agile-ts/utils';
import { logCodeManager } from '../logCodeManager';
import { Agile } from '../agile';
import { SubscriptionContainer } from './subscription';
import { CreateRuntimeJobConfigInterface, RuntimeJob } from './runtime.job';
import { IngestConfigInterface } from './runtime';

export type ObserverKey = string | number;

export class Observer<ValueType = any> {
  // Agile Instance the Observer belongs to
  public agileInstance: () => Agile;

  // Key/Name identifier of the Observer
  public key?: ObserverKey;
  // Observers that depend on this Observer
  public dependents: Set<Observer> = new Set();
  // Subscription Containers (UI-Components) the Observer is subscribed to
  public subscribedTo: Set<SubscriptionContainer> = new Set();

  /**
   * An Observer manages the subscriptions to Subscription Containers (UI-Components)
   * and dependencies to other Observers (Agile Classes)
   * for an Agile Class such as the `State Class`.
   *
   * Agile Classes often use an Observer as an interface to the Runtime.
   * In doing so, they ingest their own Observer into the Runtime
   * when the Agile Class has changed in such a way
   * that these changes need to be applied to UI-Components
   * or dependent other Observers.
   *
   * After the Observer has been ingested into the Runtime
   * wrapped into a Runtime-Job, it is first added to the Jobs queue
   * to prevent race conditions.
   * When it is executed, the Observer's `perform()` method is called,
   * where the accordingly changes are applied to the Agile Class.
   *
   * Now that the Job was performed, it is added to the rerender queue,
   * where the subscribed Subscription Container (UI-Components)
   * of the Observer are updated (re-rendered).
   *
   * Note that the Observer itself is no standalone class
   * and should be adapted to the Agile Class needs it belongs to.
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
    this.key = config.key;
    config.dependents?.forEach((observer) => this.addDependent(observer));
    config.subs?.forEach((subscriptionContainer) =>
      subscriptionContainer.addSubscription(this)
    );
  }

  /**
   * Passes the Observer into the runtime wrapped into a Runtime-Job
   * where it is executed accordingly.
   *
   * During the execution the runtime performs the Observer's `perform()` method,
   * updates its dependents and re-renders the UI-Components it is subscribed to.
   *
   * @public
   * @param config - Configuration object
   */
  public ingest(config: ObserverIngestConfigInterface = {}): void {
    if (process.env.NODE_ENV !== 'production') {
      logCodeManager.log('17:03:01');
    }
  }

  /**
   * Method executed by the Runtime to perform the Runtime-Job,
   * previously ingested via the `ingest()` method.
   *
   * Note that this method should be overwritten
   * to correctly apply the changes to the Agile Class
   * the Observer belongs to.
   *
   * @public
   * @param job - Runtime-Job to be performed.
   */
  public perform(job: RuntimeJob): void {
    if (process.env.NODE_ENV !== 'production') {
      logCodeManager.log('17:03:00');
    }
  }

  /**
   * Makes the specified Observer depend on the Observer.
   *
   * A dependent Observer is always ingested into the Runtime,
   * when the Observer it depends on has been ingested too.
   *
   * (Note: not mutating directly 'dependents' for better testing)
   *
   * @public
   * @param observer - Observer to depend on the Observer.
   */
  public addDependent(observer: Observer): void {
    if (!this.dependents.has(observer)) this.dependents.add(observer);
  }

  /**
   * Makes the specified Observer no longer depend on the Observer.
   *
   * (Note: not mutating directly 'dependents' for better testing)
   *
   * @public
   * @param observer - Observer to no longer depend on the Observer.
   */
  public removeDependent(observer: Observer): void {
    if (this.dependents.has(observer)) this.dependents.delete(observer);
  }
}

export interface CreateObserverConfigInterface<ValueType = any> {
  /**
   * Initial Observers to depend on the Observer.
   * @default []
   */
  dependents?: Array<Observer>;
  /**
   * Initial Subscription Containers the Observer is subscribed to.
   * @default []
   */
  subs?: Array<SubscriptionContainer>;
  /**
   * Key/Name identifier of the Observer.
   * @default undefined
   */
  key?: ObserverKey;
}

export interface ObserverIngestConfigInterface
  extends CreateRuntimeJobConfigInterface,
    IngestConfigInterface {}
