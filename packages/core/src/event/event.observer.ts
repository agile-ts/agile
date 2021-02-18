import {
  Observer,
  RuntimeJob,
  ObserverKey,
  Event,
  SubscriptionContainer,
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
      dependents: config.dependents,
      key: config.key,
      subs: config.subs,
    });
    this.event = () => event;
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

// Extra Interface because we don't want a value property in the config of the Event Observer
/**
 * @param dependents - Initial Dependents of Event Observer
 * @param subs - Initial Subscriptions of Event Observer
 * @param key - Key/Name of Event Observer
 */
export interface CreateEventObserverConfigInterface {
  dependents?: Array<Observer>;
  subs?: Array<SubscriptionContainer>;
  key?: ObserverKey;
}
