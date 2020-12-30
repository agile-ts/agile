import {
  defineConfig,
  RuntimeJob,
  RuntimeJobConfigInterface,
  RuntimeJobKey,
  StateObserver,
} from "../internal";

export class StateRuntimeJob extends RuntimeJob<StateObserver> {
  public config: StateRuntimeJobConfigInterface;

  constructor(
    observer: StateObserver,
    config: CreateStateRuntimeJobConfigInterface = {}
  ) {
    super(observer, config);
    config = defineConfig(config, {
      background: false,
      sideEffects: true,
      force: false,
      storage: true,
      overwrite: false,
    });

    this.config = {
      background: config.background,
      force: config.force,
      sideEffects: config.sideEffects,
      storage: config.storage,
      overwrite: config.overwrite,
    };
  }
}

/**
 * @param key - Key/Name of Job
 */
export interface CreateStateRuntimeJobConfigInterface
  extends StateRuntimeJobConfigInterface {
  key?: RuntimeJobKey;
}

/**
 * @param overwrite - If whole State Value gets overwritten with Job Value
 * @param storage - If Job Value can be saved in Storage
 */
export interface StateRuntimeJobConfigInterface
  extends RuntimeJobConfigInterface {
  overwrite?: boolean;
  storage?: boolean;
}
