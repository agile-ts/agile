import { Observer, defineConfig, SubscriptionContainer } from '../internal';

export class RuntimeJob<ObserverType extends Observer = Observer> {
  public config: RuntimeJobConfigInterface;

  // Key/Name identifier of the Subscription Container
  public _key?: RuntimeJobKey;
  // Observer the Job represents
  public observer: ObserverType;
  // Whether the Subscription Containers (Components) of the Observer can be re-rendered
  public rerender: boolean;
  // Whether the Job has been performed by the runtime
  public performed = false;
  // Subscription Container of the Observer that have to be updated/re-rendered
  public subscriptionContainersToUpdate = new Set<SubscriptionContainer>();
  // How often not ready Subscription Container of the Observer have been tried to update
  public triesToUpdate = 0;

  /**
   * A Job that contains an Observer to be executed by the runtime.
   *
   * @internal
   * @param observer - Observer to be represented by the Runtime Job.
   * @param config - Configuration object
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

  /**
   * Updates the key/name identifier of the Runtime Job.
   *
   * @public
   * @param value - New key/name identifier.
   */
  public set key(value: RuntimeJobKey | undefined) {
    this._key = value;
  }

  /**
   * Returns the key/name identifier of the Runtime Job.
   *
   * @public
   */
  public get key(): RuntimeJobKey | undefined {
    return this._key;
  }
}

export type RuntimeJobKey = string | number;

export interface CreateRuntimeJobConfigInterface
  extends RuntimeJobConfigInterface {
  /**
   * Key/Name identifier of the Runtime Job.
   * @default undefined
   */
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
  /**
   * Whether to perform the Runtime Job in background.
   * So that the UI isn't notified of these changes and thus doesn't rerender.
   * @default false
   */
  background?: boolean;
  /**
   * Configuration of the execution of defined side effects.
   * @default {enabled: true, exclude: []}
   */
  sideEffects?: SideEffectConfigInterface;
  /**
   * Whether the Runtime Job should be forced through the runtime
   * although it might be useless from the viewpoint of the runtime.
   * @default false
   */
  force?: boolean;
  /**
   * How often the runtime should try to update not ready Subscription Containers of the Observer the Job represents.
   * If 'null' the runtime tries to update the not ready Subscription Container until they are ready (infinite).
   * @default 3
   */
  numberOfTriesToUpdate?: number | null;
}

export interface SideEffectConfigInterface {
  /**
   * Whether to execute the defined side effects
   * @default true
   */
  enabled?: boolean;
  /**
   * Side effect key identifier that won't be executed.
   * @default []
   */
  exclude?: string[];
}
