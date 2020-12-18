import { Observer, defineConfig, SubscriptionContainer } from "../internal";

export class Job<ObserverType extends Observer = Observer> {
  public _key?: JobKey;
  public observer: ObserverType;
  public config: JobConfigInterface;
  public rerender: boolean; // If Job will cause rerender on subscriptionContainer in Observer
  public performed = false; // If Job has been performed by Runtime
  public subscriptionContainersToUpdate = new Set<SubscriptionContainer>(); // SubscriptionContainer that have to be updated/rerendered

  /**
   * @internal
   * Job - Holds Observer and gets executed/performed by the Runtime
   * @param observer - Observer that is represented by this Job and gets performed
   * @param config - Config
   */
  constructor(observer: ObserverType, config: CreateJobConfigInterface = {}) {
    config = defineConfig<JobConfigInterface>(config, {
      background: false,
      sideEffects: true,
      force: false,
      storage: true,
    });
    this.config = {
      background: config.background,
      force: config.force,
      sideEffects: config.sideEffects,
      storage: config.storage,
    };

    this.observer = observer;
    this.rerender =
      !config.background &&
      this.observer.agileInstance().integrations.hasIntegration();
    this._key = config.key;
    this.subscriptionContainersToUpdate = new Set(observer.subs);
  }

  public get key(): JobKey | undefined {
    return this._key;
  }

  public set key(value: JobKey | undefined) {
    this._key = value;
  }
}

export type JobKey = string | number;

/**
 * @param key - Key/Name of Job
 */
export interface CreateJobConfigInterface extends JobConfigInterface {
  key?: JobKey;
}

/**
 * @param background - If Job gets executed in the background -> not causing any rerender
 * @param sideEffects - If SideEffects gets executed
 * @param storage - If Job value gets saved in Storage
 * @param force - Force performing Job
 */
export interface JobConfigInterface {
  background?: boolean;
  sideEffects?: boolean;
  storage?: boolean;
  force?: boolean;
}
