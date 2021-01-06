import {
  Observer,
  RuntimeJob,
  ObserverKey,
  Event,
  SubscriptionContainer,
  IngestConfigInterface,
  RuntimeJobConfigInterface,
  defineConfig,
  RuntimeJobKey,
} from '../internal';

export class EventObserver<PayloadType = any> extends Observer {
  public event: () => Event<PayloadType>;

  /**
   * @internal
   * Event Observer - Handles Event dependencies and ingests Event triggers into the Runtime
   * @param event - Event
   * @param config - Config
   */
  constructor(
    event: Event<PayloadType>,
    config: CreateEventObserverConfigInterface = {}
  ) {
    super(event.agileInstance(), {
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
   * @param config - Config
   */
  public trigger(config: EventIngestConfigInterface = {}): void {
    config = defineConfig(config, {
      perform: true,
      background: false,
      sideEffects: true,
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
   * Performs Job from Runtime
   * @param job - Job that gets performed
   */
  public perform(job: RuntimeJob<this>) {
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

/**
 * @param key - Key/Name of Job that gets created
 */
export interface EventIngestConfigInterface
  extends RuntimeJobConfigInterface,
    IngestConfigInterface {
  key?: RuntimeJobKey;
}
