import {
  defineConfig,
  RuntimeJob,
  RuntimeJobConfigInterface,
  RuntimeJobKey,
  StateObserver,
} from '../internal';

export class StateRuntimeJob extends RuntimeJob<StateObserver> {
  public config: StateRuntimeJobConfigInterface;

  constructor(
    observer: StateObserver,
    config: CreateStateRuntimeJobConfigInterface = {}
  ) {
    super(observer, config);
    config = defineConfig(config, {
      background: false,
      sideEffects: {
        enabled: true,
        exclude: [],
      },
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

export interface CreateStateRuntimeJobConfigInterface
  extends StateRuntimeJobConfigInterface {
  /**
   * Key/Name identifier of the Runtime Job.
   * @default undefined
   */
  key?: RuntimeJobKey;
}

export interface StateRuntimeJobConfigInterface
  extends RuntimeJobConfigInterface {
  /**
   * Whether to overwrite the whole State with the new State value.
   * @default false
   */
  overwrite?: boolean;
  /**
   * If the State is persisted,
   * whether to store the new State value in an external Storage
   * @default true
   */
  storage?: boolean;
}
