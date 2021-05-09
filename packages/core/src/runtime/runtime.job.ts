import { Observer, defineConfig, SubscriptionContainer } from '../internal';

export class RuntimeJob<ObserverType extends Observer = Observer> {
  public _key?: RuntimeJobKey;
  public config: RuntimeJobConfigInterface;
  public observer: ObserverType; // Observer the Job represents
  public rerender: boolean; // If Job will cause rerender on subscriptionContainer in Observer
  public performed = false; // If Job has been performed by Runtime
  public subscriptionContainersToUpdate = new Set<SubscriptionContainer>(); // SubscriptionContainer (from Observer) that have to be updated/rerendered
  public triesToUpdate = 0; // How often not ready subscriptionContainers of this Job have been tried to update

  /**
   * @internal
   * Job - Represents Observer that gets performed by the Runtime
   * @param observer - Observer
   * @param config - Config
   */
  constructor(
    observer: ObserverType,
    config: CreateRuntimeJobConfigInterface = {}
  ) {
    config = defineConfig<RuntimeJobConfigInterface>(config, {
      background: false,
      sideEffects: {
        enabled: true,
        exclude: [],
      },
      force: false,
      numberOfTriesToUpdate: 3,
    });
    this.config = {
      background: config.background,
      force: config.force,
      sideEffects: config.sideEffects,
      numberOfTriesToUpdate: config.numberOfTriesToUpdate,
    };
    this.observer = observer;
    this.rerender =
      !config.background &&
      this.observer.agileInstance().integrations.hasIntegration();
    this._key = config.key;
    this.subscriptionContainersToUpdate = new Set(observer.subscribedTo);
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
 * @param numberOfTriesToUpdate - How often the runtime should try to update not ready SubscriptionContainers of this Job
 * If 'null' the runtime tries to update the not ready SubscriptionContainer until they are ready (infinite).
 * But be aware that this can lead to an overflow of 'old' Jobs after some time. (affects performance)
 */
export interface RuntimeJobConfigInterface {
  background?: boolean;
  sideEffects?: SideEffectConfigInterface;
  force?: boolean;
  numberOfTriesToUpdate?: number | null;
}

/**
 * @param enabled - If SideEffects get executed
 * @param exclude - SideEffect at Keys that doesn't get executed
 */
export interface SideEffectConfigInterface {
  enabled?: boolean;
  exclude?: string[];
}
