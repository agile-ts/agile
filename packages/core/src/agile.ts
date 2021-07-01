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
  DependableAgileInstancesType,
  CreateComputedConfigInterface,
  ComputeFunctionType,
  removeProperties,
  shared,
  runsOnServer,
} from './internal';

export class Agile {
  public config: AgileConfigInterface;

  // Queues and executes incoming Observer-based Jobs
  public runtime: Runtime;
  // Manages and simplifies the subscription to UI-Components
  public subController: SubController;
  // Handles the permanent persistence of Agile Classes
  public storages: Storages;

  // Integrations (UI-Frameworks) that are integrated into AgileTs
  public integrations: Integrations;

  // Static AgileTs Logger with the default config
  // (-> is overwritten by the last created Agile Instance)
  static logger = new Logger({
    prefix: 'Agile',
    active: true,
    level: Logger.level.SUCCESS,
  });

  // Identifier used to bind an Agile Instance globally
  static globalKey = '__agile__';

  /**
   * The Agile Class is the main Instance of AgileTs
   * and should be unique to your application.
   *
   * Simply put, the Agile Instance is the brain of AgileTs
   * and manages all [Agile Sub Instance](https://agile-ts.org/docs/introduction/#agile-sub-instance)
   * such as States.
   *
   * It should be noted that it doesn't store the States;
   * It only manages them. Each State has an Instance of the Agile Class,
   * for example, to ingest its changes into the Runtime.
   * In summary, the main tasks of the Agile Class are to:
   * - queue [Agile Sub Instance](https://agile-ts.org/docs/introduction/#agile-sub-instance)
   *   changes in the Runtime to prevent race conditions
   * - update/rerender subscribed UI-Components through the provided Integrations
   *   such as the [React Integration](https://agile-ts.org/docs/react)
   * - integrate with the persistent [Storage](https://agile-ts.org/docs/core/storage)
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
    this.config = {
      waitForMount: config.waitForMount as any,
    };
    this.integrations = new Integrations(this);
    this.runtime = new Runtime(this);
    this.subController = new SubController(this);
    this.storages = new Storages(this, {
      localStorage: config.localStorage,
    });

    // Setup listener to be notified when a external registered Integration was added
    Integrations.onRegisteredExternalIntegration((integration) => {
      this.integrate(integration);
    });

    // Assign customized Logger config to the static Logger
    this.configureLogger(config.logConfig);

    LogCodeManager.log('10:00:00', [], this, Agile.logger);

    // Create a global instance of the Agile Instance.
    // Why? 'getAgileInstance()' returns the global Agile Instance
    // if it couldn't find any Agile Instance in the specified Instance.
    if (config.bindGlobal)
      if (!globalBind(Agile.globalKey, this)) {
        LogCodeManager.log('10:02:00');
      }
  }

  /**
   * Configures the logging behaviour of AgileTs.
   *
   * @public
   * @param config - Configuration object
   */
  public configureLogger(config: CreateLoggerConfigInterface = {}): this {
    if (runsOnServer()) {
      Agile.logger = new Logger({ active: false });
      return this;
    }
    config = defineConfig(config, {
      prefix: 'Agile',
      active: true,
      level: Logger.level.SUCCESS,
      canUseCustomStyles: true,
      allowedTags: ['runtime', 'storage', 'subscription', 'multieditor'],
    });
    Agile.logger = new Logger(config);
    return this;
  }

  /**
   * Returns a newly created Storage.
   *
   * A Storage Class serves as an interface to external storages,
   * such as the [Async Storage](https://github.com/react-native-async-storage/async-storage) or
   * [Local Storage](https://www.w3schools.com/html/html5_webstorage.asp).
   *
   * It creates the foundation to easily [`persist()`](https://agile-ts.org/docs/core/state/methods#persist) [Agile Sub Instances](https://agile-ts.org/docs/introduction/#agile-sub-instance)
   * (like States or Collections) in nearly any external storage.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstorage)
   *
   * @public
   * @param config - Configuration object
   */
  public createStorage(config: CreateStorageConfigInterface): Storage {
    return createStorage({ ...config, ...{ agileInstance: this } });
  }

  /**
   * Returns a newly created State.
   *
   * A State manages a piece of Information
   * that we need to remember globally at a later point in time.
   * While providing a toolkit to use and mutate this piece of Information.
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
    return createState<ValueType>(initialValue, {
      ...config,
      ...{ agileInstance: this },
    });
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
    return createCollection<DataType>(config, this);
  }

  /**
   * Returns a newly created Computed.
   *
   * A Computed is an extension of the State Class
   * that computes its value based on a specified compute function.
   *
   * The computed value will be cached to avoid unnecessary recomputes
   * and is only recomputed when one of its direct dependencies changes.
   *
   * Direct dependencies can be States and Collections.
   * So when, for example, a dependent State value changes, the computed value is recomputed.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstate)
   *
   * @public
   * @param computeFunction - Function to compute the computed value.
   * @param config - Configuration object
   */
  public createComputed<ComputedValueType = any>(
    computeFunction: ComputeFunctionType<ComputedValueType>,
    config?: CreateComputedConfigInterface
  ): Computed<ComputedValueType>;
  /**
   * Returns a newly created Computed.
   *
   * A Computed is an extension of the State Class
   * that computes its value based on a specified compute function.
   *
   * The computed value will be cached to avoid unnecessary recomputes
   * and is only recomputed when one of its direct dependencies changes.
   *
   * Direct dependencies can be States and Collections.
   * So when, for example, a dependent State value changes, the computed value is recomputed.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createcomputed)
   *
   * @public
   * @param computeFunction - Function to compute the computed value.
   * @param deps - Hard-coded dependencies on which the Computed Class should depend.
   */
  public createComputed<ComputedValueType = any>(
    computeFunction: ComputeFunctionType<ComputedValueType>,
    deps?: Array<DependableAgileInstancesType>
  ): Computed<ComputedValueType>;
  public createComputed<ComputedValueType = any>(
    computeFunction: ComputeFunctionType<ComputedValueType>,
    configOrDeps?:
      | CreateComputedConfigInterface
      | Array<DependableAgileInstancesType>
  ): Computed<ComputedValueType> {
    let _config: CreateComputedConfigInterface = {};

    if (Array.isArray(configOrDeps)) {
      _config = flatMerge(_config, {
        computedDeps: configOrDeps,
        agileInstance: this,
      });
    } else {
      if (configOrDeps)
        _config = { ...configOrDeps, ...{ agileInstance: this } };
    }

    return createComputed<ComputedValueType>(computeFunction, _config);
  }

  /**
   * Registers the specified Integration with AgileTs.
   *
   * After a successful registration,
   * [Agile Sub Instances](https://agile-ts.org/docs/introduction/#agile-sub-instance) such as States
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
   * [Agile Sub Instances](https://agile-ts.org/docs/introduction/#agile-sub-instance) such as States
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

/**
 * Returns a newly created Storage.
 *
 * A Storage Class serves as an interface to external storages,
 * such as the [Async Storage](https://github.com/react-native-async-storage/async-storage) or
 * [Local Storage](https://www.w3schools.com/html/html5_webstorage.asp).
 *
 * It creates the foundation to easily [`persist()`](https://agile-ts.org/docs/core/state/methods#persist) [Agile Sub Instances](https://agile-ts.org/docs/introduction/#agile-sub-instance)
 * (like States or Collections) in nearly any external storage.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstorage)
 *
 * @public
 * @param config - Configuration object
 */
export function createStorage(config: CreateStorageConfigInterface): Storage {
  return new Storage(config);
}

/**
 * Returns a newly created State.
 *
 * A State manages a piece of Information
 * that we need to remember globally at a later point in time.
 * While providing a toolkit to use and mutate this piece of Information.
 *
 * You can create as many global States as you need.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstate)
 *
 * @public
 * @param initialValue - Initial value of the State.
 * @param config - Configuration object
 */
export function createState<ValueType = any>(
  initialValue: ValueType,
  config: CreateStateConfigInterfaceWithAgile = {}
): State<ValueType> {
  config = defineConfig(config, {
    agileInstance: shared,
  });
  return new State<ValueType>(
    config.agileInstance as any,
    initialValue,
    removeProperties(config, ['agileInstance'])
  );
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
 * @param agileInstance - Instance of Agile the Collection belongs to.
 */
export function createCollection<DataType extends Object = DefaultItem>(
  config?: CollectionConfig<DataType>,
  agileInstance: Agile = shared
): Collection<DataType> {
  return new Collection<DataType>(agileInstance, config);
}

/**
 * Returns a newly created Computed.
 *
 * A Computed is an extension of the State Class
 * that computes its value based on a specified compute function.
 *
 * The computed value will be cached to avoid unnecessary recomputes
 * and is only recomputed when one of its direct dependencies changes.
 *
 * Direct dependencies can be States and Collections.
 * So when, for example, a dependent State value changes, the computed value is recomputed.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstate)
 *
 * @public
 * @param computeFunction - Function to compute the computed value.
 * @param config - Configuration object
 */
export function createComputed<ComputedValueType = any>(
  computeFunction: ComputeFunctionType<ComputedValueType>,
  config?: CreateComputedConfigInterfaceWithAgile
): Computed<ComputedValueType>;
/**
 * Returns a newly created Computed.
 *
 * A Computed is an extension of the State Class
 * that computes its value based on a specified compute function.
 *
 * The computed value will be cached to avoid unnecessary recomputes
 * and is only recomputed when one of its direct dependencies changes.
 *
 * Direct dependencies can be States and Collections.
 * So when, for example, a dependent State value changes, the computed value is recomputed.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createcomputed)
 *
 * @public
 * @param computeFunction - Function to compute the computed value.
 * @param deps - Hard-coded dependencies on which the Computed Class should depend.
 */
export function createComputed<ComputedValueType = any>(
  computeFunction: ComputeFunctionType<ComputedValueType>,
  deps?: Array<DependableAgileInstancesType>
): Computed<ComputedValueType>;
export function createComputed<ComputedValueType = any>(
  computeFunction: ComputeFunctionType<ComputedValueType>,
  configOrDeps?:
    | CreateComputedConfigInterface
    | Array<DependableAgileInstancesType>
): Computed<ComputedValueType> {
  let _config: CreateComputedConfigInterfaceWithAgile = {};

  if (Array.isArray(configOrDeps)) {
    _config = flatMerge(_config, {
      computedDeps: configOrDeps,
    });
  } else {
    if (configOrDeps) _config = configOrDeps;
  }

  _config = defineConfig(_config, {
    agileInstance: shared,
  });

  return new Computed<ComputedValueType>(
    _config.agileInstance as any,
    computeFunction,
    removeProperties(_config, ['agileInstance'])
  );
}

export interface CreateAgileSubInstanceInterface {
  /**
   * Instance of Agile the Instance belongs to.
   * @default Agile.shared
   */
  agileInstance?: Agile;
}

export interface CreateStateConfigInterfaceWithAgile
  extends CreateAgileSubInstanceInterface,
    StateConfigInterface {}

export interface CreateComputedConfigInterfaceWithAgile
  extends CreateAgileSubInstanceInterface,
    CreateComputedConfigInterface {}

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
   * Whether the Subscription Container shouldn't be ready
   * until the UI-Component it represents has been mounted.
   * @default true
   */
  waitForMount?: boolean;
  /**
   * Whether the Local Storage should be registered as a Agile Storage by default.
   * @default true
   */
  localStorage?: boolean;
  /**
   * Whether the Agile Instance should be globally bound (globalThis)
   * and thus be globally available.
   * @default false
   */
  bindGlobal?: boolean;
}

export interface AgileConfigInterface {
  /**
   * Whether the Subscription Container shouldn't be ready
   * until the UI-Component it represents has been mounted.
   * @default true
   */
  waitForMount: boolean;
}
