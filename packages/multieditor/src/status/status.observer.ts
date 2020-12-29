import { Status, StatusInterface } from "../internal";
import {
  Agile,
  copy,
  defineConfig,
  equal,
  IngestConfigInterface,
  Observer,
  ObserverKey,
  RuntimeJob,
  RuntimeJobConfigInterface,
} from "@agile-ts/core";

export class StatusObserver extends Observer {
  public status: () => Status;
  public nextValue: StatusInterface | null;

  /**
   * @internal
   * Status Observer - Handles Status changes, dependencies (-> Interface to Runtime)
   * @param agileInstance - An instance of Agile
   * @param status - Status
   * @param config - Config
   */
  constructor(
    agileInstance: Agile,
    status: Status,
    config: StatusObserverConfigInterface = {}
  ) {
    super(agileInstance, {
      key: config.key,
      deps: config.deps,
      value: status._value,
    });
    this.status = () => status;
    this.nextValue = copy(status._value);
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Assigns next Status Value to current Status Value
   * @param config - Config
   */
  public assign(config: StatusIngestConfigInterface = {}): void {
    config = defineConfig(config, {
      perform: true,
      background: false,
      sideEffects: true,
      force: false,
    });

    // Set Next Status Value
    this.nextValue = copy(this.status().nextValue);

    // Check if Status changed
    if (equal(this.status()._value, this.nextValue) && !config.force) return;

    // Create Job
    const job = new RuntimeJob(this, {
      sideEffects: config.sideEffects,
      force: config.force,
      background: config.background,
      key: this._key,
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
    const status = job.observer.status();

    // Set new State Value
    status._value = copy(this.nextValue);
    status.nextValue = copy(this.nextValue);

    // Update Observer value
    this.value = copy(this.nextValue);
  }
}

/**
 * @param deps - Initial Dependencies of Status Observer
 * @param key - Key/Name of Status Observer
 */
export interface StatusObserverConfigInterface {
  deps?: Array<Observer>;
  key?: ObserverKey;
}

export interface StatusIngestConfigInterface
  extends RuntimeJobConfigInterface,
    IngestConfigInterface {}
