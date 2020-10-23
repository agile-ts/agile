import { Agile, Observer, Job, ObserverKey, Event } from "../internal";

export class EventObserver<PayloadType = any> extends Observer {
  public event: () => Event<PayloadType>;

  /**
   * @internal
   * Event Observer - Handles Event dependencies and ingests Event triggers into the Runtime
   * @param {Agile} agileInstance - An instance of Agile
   * @param {Event} event - Event
   * @param {Array<Observer>} deps - Initial Dependencies of the Event
   * @param {ObserverKey} key - Key/Name of Event Observer
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
   * Triggers a rerender on Components which got subscribed by this Event
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
