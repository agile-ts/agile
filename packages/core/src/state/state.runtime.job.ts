import { defineConfig } from '@agile-ts/utils';
import {
  RuntimeJob,
  RuntimeJobConfigInterface,
  RuntimeJobKey,
} from '../runtime';
import { StateObserver } from './state.observer';

export class StateRuntimeJob extends RuntimeJob<
  StateObserver,
  StateRuntimeJobConfigInterface
> {
  /**
   * A State Runtime Job is sent to the Runtime on behalf of the State Observer it represents.
   *
   * In the Runtime, the State Observer is performed via its `perform()` method
   * and the Subscription Containers (UI-Components)
   * to which it is subscribed are updated (re-rendered) accordingly.
   *
   * @internal
   * @param observer - State Observer to be represented by the State Runtime Job.
   * @param config - Configuration object
   */
  constructor(
    observer: StateObserver,
    config: CreateStateRuntimeJobConfigInterface = {}
  ) {
    super(observer, config);
    config = defineConfig(config, {
      storage: true,
      overwrite: false,
    });

    this.config['overwrite'] = config.overwrite;
    this.config['storage'] = config.storage;
  }
}

export interface CreateStateRuntimeJobConfigInterface
  extends StateRuntimeJobConfigInterface {
  /**
   * Key/Name identifier of the State Runtime Job.
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
   * whether to apply the new State value to the external Storages.
   * @default true
   */
  storage?: boolean;
}
