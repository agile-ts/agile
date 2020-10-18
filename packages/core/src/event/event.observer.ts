import { Agile, Observer, Job, ObserverKey, Event } from "../internal";

export class EventObserver<PayloadType = any> extends Observer {
  public event: () => Event<PayloadType>;

  /**
   * @internal
   * Event Observer - Ingest triggers into the Runtime
   * @param {Agile} agileInstance - An instance of Agile
   * @param {Event} event - Event
   * @param {Array<Observer>} deps - Initial Dependencies of the State
   * @param {ObserverKey} key - Key/Name of the Observer
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
   * Triggers a rerender
   */
  public trigger(): void {
    this.agileInstance().runtime.ingest(this, {});
  }

  //=========================================================================================================
  // Perform
  //=========================================================================================================
  /**
   * @internal
   * Performs a Job
   * @param {Job<this>} job - The Job which should be performed
   */
  public perform(job: Job<this>) {
    // Noting to perform
  }
}
