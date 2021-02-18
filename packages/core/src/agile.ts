import {
  Runtime,
  Integration,
  State,
  Storage,
  Collection,
  CollectionConfig,
  DefaultItem,
  Computed,
  Event,
  CreateEventConfigInterface,
  DefaultEventPayload,
  Integrations,
  Observer,
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
  Group,
} from './internal';

export class Agile {
  public config: AgileConfigInterface;

  public runtime: Runtime; // Handles assigning Values to Agile Instances
  public subController: SubController; // Handles subscriptions to Components
  public storages: Storages; // Handles permanent saving

  // Integrations
  public integrations: Integrations; // Integrated frameworks
  static initialIntegrations: Integration[] = []; // External added initial Integrations

  // Static Logger with default config -> will be overwritten by config of last created Agile Instance
  static logger = new Logger({
    prefix: 'Agile',
    active: true,
    level: Logger.level.WARN,
  });

  /**
   * @public
   * Agile - Global state and logic framework for reactive Typescript & Javascript applications
   * @param config - Config
   */
  constructor(config: CreateAgileConfigInterface = {}) {
    config = defineConfig(config, {
      localStorage: true,
      waitForMount: true,
      logConfig: {},
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

    // Assign customized config to Logger
    Agile.logger = new Logger(config.logConfig);

    // Logging
    Agile.logger.success('Created new AgileInstance ', this, Agile.logger);

    // Create global instance of Agile
    if (!globalBind('__agile__', this))
      Agile.logger.warn(
        'Be careful with multiple Agile Instances in one Application!'
      );
  }

  //=========================================================================================================
  // Storage
  //=========================================================================================================
  /**
   * @public
   * Storage - Handy Interface for storing Items permanently
   * @param config - Config
   */
  public createStorage(config: CreateStorageConfigInterface): Storage {
    return new Storage(config);
  }

  //=========================================================================================================
  // State
  //=========================================================================================================
  /**
   * @public
   * State - Class that holds one Value and causes rerender on subscribed Components
   * @param initialValue - Initial Value of the State
   * @param config - Config
   */
  public createState<ValueType = any>(
    initialValue: ValueType,
    config: StateConfigInterface = {}
  ): State<ValueType> {
    return new State<ValueType>(this, initialValue, config);
  }

  //=========================================================================================================
  // Collection
  //=========================================================================================================
  /**
   * @public
   * Collection - Class that holds a List of Objects with key and causes rerender on subscribed Components
   * @param config - Config
   */
  public createCollection<DataType = DefaultItem>(
    config?: CollectionConfig<DataType>
  ): Collection<DataType> {
    return new Collection<DataType>(this, config);
  }

  //=========================================================================================================
  // Computed
  //=========================================================================================================
  /**
   * @public
   * Computed - Function that recomputes its value if a dependency changes
   * @param computeFunction - Function for computing value
   * @param config - Config
   * @param deps - Hard coded dependencies of Computed Function
   */
  public createComputed<ComputedValueType = any>(
    computeFunction: () => ComputedValueType,
    config?: StateConfigInterface,
    deps?: Array<Observer | State | Event | Group>
  ): Computed<ComputedValueType>;
  /**
   * @public
   * Computed - Function that recomputes its value if a dependency changes
   * @param computeFunction - Function for computing value
   * @param deps - Hard coded dependencies of Computed Function
   */
  public createComputed<ComputedValueType = any>(
    computeFunction: () => ComputedValueType,
    deps?: Array<Observer | State | Event>
  ): Computed<ComputedValueType>;
  public createComputed<ComputedValueType = any>(
    computeFunction: () => ComputedValueType,
    configOrDeps?: StateConfigInterface | Array<Observer | State | Event>,
    deps?: Array<Observer | State | Event>
  ): Computed<ComputedValueType> {
    let _deps: Array<Observer | State | Event>;
    let _config: StateConfigInterface;

    if (Array.isArray(configOrDeps)) {
      _deps = configOrDeps;
      _config = {};
    } else {
      _config = configOrDeps || {};
      _deps = deps || [];
    }

    return new Computed<ComputedValueType>(
      this,
      computeFunction,
      flatMerge(_config, {
        computedDeps: _deps,
      })
    );
  }

  //=========================================================================================================
  // Event
  //=========================================================================================================
  /**
   * @public
   * Event - Class that holds a List of Functions which can be triggered at the same time
   * @param config - Config
   */
  public createEvent<PayloadType = DefaultEventPayload>(
    config?: CreateEventConfigInterface
  ) {
    return new Event<PayloadType>(this, config);
  }

  //=========================================================================================================
  // Integrate
  //=========================================================================================================
  /**
   * @public
   * Integrates framework into Agile
   * @param integration - Integration that gets registered/integrated
   */
  public integrate(integration: Integration) {
    this.integrations.integrate(integration);
    return this;
  }

  //=========================================================================================================
  // Register Storage
  //=========================================================================================================
  /**
   * @public
   * Registers new Storage as Agile Storage
   * @param storage - new Storage
   * @param config - Config
   */
  public registerStorage(
    storage: Storage,
    config: RegisterConfigInterface = {}
  ): this {
    this.storages.register(storage, config);
    return this;
  }

  //=========================================================================================================
  // Has Integration
  //=========================================================================================================
  /**
   * @public
   * Checks if Agile has any registered Integration
   */
  public hasIntegration(): boolean {
    return this.integrations.hasIntegration();
  }

  //=========================================================================================================
  // Has Storage
  //=========================================================================================================
  /**
   * @public
   * Checks if Agile has any registered Storage
   */
  public hasStorage(): boolean {
    return this.storages.hasStorage();
  }
}

/**
 * @param logJobs - Allow Agile Logs
 * @param waitForMount - If Agile should wait until the component mounts
 * @param storageConfig - To configure Agile Storage
 */
export interface CreateAgileConfigInterface {
  logConfig?: CreateLoggerConfigInterface;
  waitForMount?: boolean;
  localStorage?: boolean;
}

/**
 * @param waitForMount - If Agile should wait until the component mounts
 */
export interface AgileConfigInterface {
  waitForMount: boolean;
}
