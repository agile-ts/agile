import { Agile, Observer, Job, ObserverKey, Event } from "../internal";

export class EventObserver<PayloadType = any> extends Observer {
  public event: () => Event<PayloadType>;

  /**
   * @internal
   * Event Observer - Handles Event dependencies and ingests Event triggers into the Runtime
   * @param agileInstance - An instance of Agile
   * @param event - Event
   * @param deps - Initial Dependencies of the Event
   * @param key - Key/Name of Event Observer
   */
  constructor(
    agileInstance: Agile,
    event: Event<PayloadType>,
    deps?: Array<Observer>,
    key?: ObserverKey
  ) {
    super(agileInstance, deps, key);
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
