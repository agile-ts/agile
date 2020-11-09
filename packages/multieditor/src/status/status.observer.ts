import { Status, StatusInterface } from "./index";
import {
  Agile,
  copy,
  defineConfig,
  equal,
  Job,
  JobConfigInterface,
  Observer,
  ObserverKey,
} from "@agile-ts/core";

export class StatusObserver extends Observer {
  public status: () => Status;
  public nextStatus: StatusInterface | null;

  /**
   * @internal
   * State Observer - Handles State changes, dependencies (-> Interface to Runtime)
   * @param agileInstance - An instance of Agile
   * @param status - Status
   * @param deps - Initial Dependencies of State Observer
   * @param key - Key/Name of State Observer
   */
  constructor(
    agileInstance: Agile,
    status: Status,
    deps?: Array<Observer>,
    key?: ObserverKey
  ) {
    super(agileInstance, deps, key, status.status);
    this.status = () => status;
    this.nextStatus = status.status;
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Ingests new State Value into Runtime and applies it to the State
   * @param config - Config
   */
  public ingest(config: StatusJobConfig = {}): void {
    const status = this.status();
    config = defineConfig(config, {
      perform: true,
      background: false,
      sideEffects: true,
      forceRerender: false,
      storage: true,
    });

    // If forceRerender, set background config to false since forceRerender is 'stronger' than background
    if (config.forceRerender && config.background) config.background = false;

    // Set Next Status
    this.nextStatus = status.nextStatus;

    // Check if Statuses stayed the same
    if (equal(status.status, this.nextStatus) && !config.forceRerender) return;

    this.agileInstance().runtime.ingest(this, config);
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
    const state = job.observer.status();

    // Set new State Value
    state.status = copy(this.nextStatus);
    state.nextStatus = copy(this.nextStatus);

    // Update Observer value
    this.value = copy(this.nextStatus);
  }
}

/**
 * @param forceRerender - Force rerender no matter what happens
 */
export interface StatusJobConfig extends JobConfigInterface {
  forceRerender?: boolean;
}
