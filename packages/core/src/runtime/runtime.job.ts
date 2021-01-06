import { Observer, defineConfig, SubscriptionContainer } from '../internal';

export class RuntimeJob<ObserverType extends Observer = Observer> {
  public _key?: RuntimeJobKey;
  public observer: ObserverType;
  public config: RuntimeJobConfigInterface;
  public rerender: boolean; // If Job will cause rerender on subscriptionContainer in Observer
  public performed = false; // If Job has been performed by Runtime
  public subscriptionContainersToUpdate = new Set<SubscriptionContainer>(); // SubscriptionContainer that have to be updated/rerendered

  /**
   * @internal
   * Job - Represents Observer that gets performed by the Runtime
   * @param observer - Observer
   * @param config - Config
   */
  constructor(
    observer: ObserverType,
    config: CreateRuntimeJobConfigInterface = {},
  ) {
    config = defineConfig<RuntimeJobConfigInterface>(config, {
      background: false,
      sideEffects: true,
      force: false,
    });
    this.config = {
      background: config.background,
      force: config.force,
      sideEffects: config.sideEffects,
    };
    this.observer = observer;
    this.rerender =
      !config.background &&
      this.observer.agileInstance().integrations.hasIntegration();
    this._key = config.key;
    this.subscriptionContainersToUpdate = new Set(observer.subs);
  }

  public get key(): RuntimeJobKey | undefined {
    return this._key;
  }

  public set key(value: RuntimeJobKey | undefined) {
    this._key = value;
  }
}

export type RuntimeJobKey = string | number;

/**
 * @param key - Key/Name of RuntimeJob
 */
export interface CreateRuntimeJobConfigInterface
  extends RuntimeJobConfigInterface {
  key?: RuntimeJobKey;
}

/**
 * @param background - If Job gets executed in the background -> not causing any rerender
 * @param sideEffects - If SideEffects get executed
 * @param force - Force performing Job
 */
export interface RuntimeJobConfigInterface {
  background?: boolean;
  sideEffects?: boolean;
  force?: boolean;
}
