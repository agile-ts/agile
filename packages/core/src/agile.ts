import {
  Runtime,
  Integration,
  State,
  Storage,
  Collection,
  CollectionConfig,
  DefaultItem,
  Computed,
  Integrations,
  SubController,
  globalBind,
  Storages,
  CreateStorageConfigInterface,
  RegisterConfigInterface,
  defineConfig,
  Logger,
  CreateLoggerConfigInterface,
  StateConfigInterface,
  flatMerge,
  LogCodeManager,
  ComputedConfigInterface,
  SubscribableAgileInstancesType,
} from './internal';

export class Agile {
  public config: AgileConfigInterface;

  // Queues and executes incoming Observer-based Jobs
  public runtime: Runtime;
  // Manages and simplifies the subscription to UI-Components
  public subController: SubController;
  // Handles the permanent persistence of Agile Classes
  public storages: Storages;

  // Frameworks that are integrated into AgileTs
  public integrations: Integrations;
  // External added Integrations that are integrated into AgileTs when it is instantiated
  static initialIntegrations: Integration[] = [];

  // Static AgileTs Logger with default config
  // (-> is overwritten by the last created Agile Instance)
  static logger = new Logger({
    prefix: 'Agile',
    active: true,
    level: Logger.level.WARN,
  });

  // Identifier used to bind an Agile Instance globally
  static globalKey = '__agile__';

  /**
   * The Agile Class is the main Instance of AgileTs
   * and should be unique to your application.
   *
   * Simply put, the Agile Instance is the brain of AgileTs
   * and manages all [`Agile Sub Instance`](../main/Introduction.md#agile-sub-instance)
   * like States.
   *
   * It should be noted that it doesn't store the States;
   * It only manages them. Each State has an Instance of the Agile Class,
   * for example, to ingest its changes into the runtime.
   * In summary, the main tasks of the Agile Class are to:
   * - queuing [`Agile Sub Instance`](../main/Introduction.md#agile-sub-instance)
   *    changes in the `runtime` and preventing race conditions
   * - update/rerender subscribed Components
   *   through Integrations like the [React Integration](../packages/react/Introduction.md)
   * - Integrating with persistent [Storage](../packages/core/features/storage/Introduction.md)
   * - provide configuration object
   *
   * Each Agile Sub Instance requires an Agile Instance to be instantiated and function properly.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/)
   *
   * @public
   * @param config - Configuration object
   */
  constructor(config: CreateAgileConfigInterface = {}) {
    config = defineConfig(config, {
      localStorage: true,
      waitForMount: true,
      logConfig: {},
      bindGlobal: false,
    });
    config.logConfig = defineConfig(config.logConfig, {
      prefix: 'Agile',
      active: true,
      level: Logger.level.WARN,
      canUseCustomStyles: true,
      allowedTags: ['runtime', 'storage', 'subscription', 'multieditor'],
    });
    this.config = {
      waitForMount: config.waitForMount as any,
    };
    this.integrations = new Integrations(this);
    this.runtime = new Runtime(this);
    this.subController = new SubController(this);
    this.storages = new Storages(this, {
      localStorage: config.localStorage,
    });

    // Assign customized config to static Logger
    Agile.logger = new Logger(config.logConfig);

    // Logging
    LogCodeManager.log('10:00:00', [], this, Agile.logger);

    // Create global instance of Agile.
    // Why? 'getAgileInstance()' returns the global Agile Instance
    // if it couldn't find any Agile Instance in the specified Instance.
    if (config.bindGlobal)
      if (!globalBind(Agile.globalKey, this)) LogCodeManager.log('10:02:00');
  }

  /**
   * Returns a newly created Storage.
   *
   * A Storage represents an external storage
   * such as the Local Storage and is an interface for AgileTs to it.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstorage)
   *
   * @public
   * @param config - Configuration object
   */
  public createStorage(config: CreateStorageConfigInterface): Storage {
    return new Storage(config);
  }

  /**
   * Returns a newly created State.
   *
   * A State manages a piece of Information
   * that we need to remember globally at a later point in time.
   * While providing a toolkit to use and mutate this set of Information.
   *
   * You can create as many global States as you need.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstate)
   *
   * @public
   * @param initialValue - Initial value of the State.
   * @param config - Configuration object
   */
  public createState<ValueType = any>(
    initialValue: ValueType,
    config: StateConfigInterface = {}
  ): State<ValueType> {
    return new State<ValueType>(this, initialValue, config);
  }

  /**
   * Returns a newly created Collection.
   *
   * A Collection manages a reactive set of Information
   * that we need to remember globally at a later point in time.
   * While providing a toolkit to use and mutate this set of Information.
   *
   * It is designed for arrays of data objects following the same pattern.
   *
   * Each of these data object must have a unique `primaryKey` to be correctly identified later.
   *
   * You can create as many global Collections as you need.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createcollection)
   *
   * @public
   * @param config - Configuration object
   */
  public createCollection<DataType extends Object = DefaultItem>(
    config?: CollectionConfig<DataType>
  ): Collection<DataType> {
    return new Collection<DataType>(this, config);
  }

  /**
   * Returns a newly created Computed.
   *
   * A Computed is an extension of the State Class
   * that computes its value based on a compute function.
   *
   * The computed value will be cached to avoid unnecessary recomputes
   * and is only recomputed when one of its direct dependencies changes.
   *
   * Direct dependencies can be States and Collections.
   * So when for example a dependent State value changes, the computed value will be recomputed.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstate)
   *
   * @public
   * @param computeFunction - Function to compute the computed value.
   * @param config - Configuration object
   */
  public createComputed<ComputedValueType = any>(
    computeFunction: () => ComputedValueType,
    config?: ComputedConfigInterface
  ): Computed<ComputedValueType>;
  /**
   * Returns a newly created Computed.
   *
   * A Computed is an extension of the State Class
   * that computes its value based on a compute function.
   *
   * The computed value will be cached to avoid unnecessary recomputes
   * and is only recomputed when one of its direct dependencies changes.
   *
   * Direct dependencies can be States and Collections.
   * So when for example a dependent State value changes, the computed value will be recomputed.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createcomputed)
   *
   * @public
   * @param computeFunction - Function to compute the computed value.
   * @param deps - Hard-coded dependencies on which the Computed Class should depend.
   */
  public createComputed<ComputedValueType = any>(
    computeFunction: () => ComputedValueType,
    deps?: Array<SubscribableAgileInstancesType>
  ): Computed<ComputedValueType>;
  public createComputed<ComputedValueType = any>(
    computeFunction: () => ComputedValueType,
    configOrDeps?:
      | ComputedConfigInterface
      | Array<SubscribableAgileInstancesType>
  ): Computed<ComputedValueType> {
    let _config: ComputedConfigInterface = {};

    if (Array.isArray(configOrDeps)) {
      _config = flatMerge(_config, {
        computedDeps: configOrDeps,
      });
    } else {
      if (configOrDeps) _config = configOrDeps;
    }

    return new Computed<ComputedValueType>(this, computeFunction, _config);
  }

  /**
   * Registers the specified Integration with AgileTs.
   *
   * After a successful registration,
   * Agile Sub Instances such as States
   * can be bound to the Integration's UI-Components for reactivity.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#integrate)
   *
   * @public
   * @param integration - Integration to be integrated/registered.
   */
  public integrate(integration: Integration) {
    this.integrations.integrate(integration);
    return this;
  }

  /**
   * Registers the specified Storage with AgileTs.
   *
   * After a successful registration,
   * Agile Sub Instances such as States
   * can be persisted in the external Storage.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#registerstorage)
   *
   * @public
   * @param storage - Storage to be registered.
   * @param config - Configuration object
   */
  public registerStorage(
    storage: Storage,
    config: RegisterConfigInterface = {}
  ): this {
    this.storages.register(storage, config);
    return this;
  }

  /**
   * Returns a boolean indicating whether any Integration
   * has been registered with AgileTs or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#hasintegration)
   *
   * @public
   */
  public hasIntegration(): boolean {
    return this.integrations.hasIntegration();
  }

  /**
   * Returns a boolean indicating whether any Storage
   * has been registered with AgileTs or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#hasstorage)
   *
   * @public
   */
  public hasStorage(): boolean {
    return this.storages.hasStorage();
  }
}

export interface CreateAgileConfigInterface {
  /**
   * Configures the logging behaviour of AgileTs.
   * @default {
      prefix: 'Agile',
      active: true,
      level: Logger.level.WARN,
      canUseCustomStyles: true,
      allowedTags: ['runtime', 'storage', 'subscription', 'multieditor'],
    }
   */
  logConfig?: CreateLoggerConfigInterface;
  /**
   * Whether the Subscription Container should not be ready
   * until the UI-Component it represents has been mounted.
   * @default true
   */
  waitForMount?: boolean;
  /**
   * Whether the Local Storage should be registered as Storage by default.
   * @default true
   */
  localStorage?: boolean;
  /**
   * Whether the Agile instance should be globally bound (globalThis)
   * and thus be globally available.
   * @default false
   */
  bindGlobal?: boolean;
}

export interface AgileConfigInterface {
  /**
   * Whether the Subscription Container should not be ready
   * until the UI-Component it represents has been mounted.
   * @default true
   */
  waitForMount: boolean;
}
