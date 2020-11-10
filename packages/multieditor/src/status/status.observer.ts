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
  public nextValue: StatusInterface | null;

  /**
   * @internal
   * Status Observer - Handles Status changes, dependencies (-> Interface to Runtime)
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
    super(agileInstance, deps, key, status._value);
    this.status = () => status;
    this.nextValue = copy(status._value);
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Assigns nextValue to _value
   * @param config - Config
   */
  public assign(config: StatusJobConfig = {}): void {
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
    this.nextValue = copy(this.status().nextValue);

    // Check if Statuses stayed the same
    if (equal(this.status()._value, this.nextValue) && !config.forceRerender)
      return;

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
    const status = job.observer.status();

    // Set new State Value
    status._value = copy(this.nextValue);
    status.nextValue = copy(this.nextValue);

    // Update Observer value
    this.value = copy(this.nextValue);
  }
}

/**
 * @param forceRerender - Force rerender no matter what happens
 */
export interface StatusJobConfig extends JobConfigInterface {
  forceRerender?: boolean;
}
