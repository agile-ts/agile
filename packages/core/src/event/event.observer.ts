import {
  Agile,
  Observer,
  Job,
  ObserverKey,
  Event,
  SubscriptionContainer,
  defineConfig,
} from "../internal";

export class EventObserver<PayloadType = any> extends Observer {
  public event: () => Event<PayloadType>;

  /**
   * @internal
   * Event Observer - Handles Event dependencies and ingests Event triggers into the Runtime
   * @param agileInstance - An instance of Agile
   * @param event - Event
   * @param config - Config
   */
  constructor(
    agileInstance: Agile,
    event: Event<PayloadType>,
    config: CreateEventObserverConfigInterface = {}
  ) {
    config = defineConfig(config, {
      deps: [],
      subs: [],
    });
    super(agileInstance, {
      deps: config.deps,
      key: config.key,
      subs: config.subs,
    });
    this.event = () => event;
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Ingests Event into Runtime and causes Rerender on Components that got subscribed by the Event (Observer)
   */
  public trigger(): void {
    this.agileInstance().runtime.ingest(this, {});
  }

  //=========================================================================================================
  // Perform
  //=========================================================================================================
  /**
   * @internal
   * Performs Job from Runtime
   * @param job - Job that gets performed
   */
  public perform(job: Job<this>) {
    // Noting to perform
  }
}

/**
 * @param deps - Initial Dependencies of Event Observer
 * @param subs - Initial Subscriptions of Event Observer
 * @param key - Key/Name of Event Observer
 */
export interface CreateEventObserverConfigInterface {
  deps?: Array<Observer>;
  subs?: Array<SubscriptionContainer>;
  key?: ObserverKey;
}
